import os
import shutil
import uuid
import json
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Novellia API", version="0.1.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 디렉토리 설정
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class LorebookEntry(BaseModel):
    name: str
    keywords: List[str]
    content: str

class StatusConfig(BaseModel):
    background: List[str] = ["날짜", "시간", "장소", "날씨", "상황"]
    character: List[str] = ["기분", "컨디션", "착장", "포즈", "목표", "관계성", "속마음", "소지품"]

class Character(BaseModel):
    name: str
    description: str
    greeting: str  # Intro/Greeting context
    speech_style: Optional[str] = "일반"
    response_length: Optional[str] = "보통"
    expression_mode: Optional[str] = "균형"
    plot_speed: Optional[str] = "보통"
    atmosphere: Optional[str] = "일반"
    storytelling_style: Optional[str] = "1인칭"
    use_status_window: Optional[bool] = False
    status_config: Optional[StatusConfig] = StatusConfig()
    persona: Optional[str] = None
    lorebook: List[LorebookEntry] = []
    tags: List[str] = []
    avatar_url: Optional[str] = "/avatar.png"
    cover_url: Optional[str] = None
    is_public: Optional[bool] = True # 공개 여부 추가

class UserProfile(BaseModel):
    name: str
    short_bio: Optional[str] = ""
    description: Optional[str] = ""
    persona: Optional[str] = "" # 유저 로어/페르소나 추가
    avatar_url: Optional[str] = "/avatar.png"
    use_playing_name: bool = True

class ImageRequest(BaseModel):
    prompt: str

class NamuRequest(BaseModel):
    url: str

class SceneImageRequest(BaseModel):
    prompt: str
    char_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    index: int = -1 # 단일 캐릭터용 (레거시 지원)
    char_id: Optional[str] = None
    char_ids: List[str] = [] # 멀티 캐릭터용 ID 리스트
    chat_history: List[dict] = []
    user_profile_index: Optional[int] = None

# 데이터 영구 저장을 위한 설정
CHARACTERS_FILE = "characters.json"
PROFILES_FILE = "profiles.json"
CHATS_FILE = "chats.json"
FEED_FILE = "feeds.json"

def load_db(file_path, default_data):
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
    return default_data

def save_db(file_path, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving {file_path}: {e}")

# 초기 데이터 로드
characters_db = load_db(CHARACTERS_FILE, [])
user_profiles_db = load_db(PROFILES_FILE, [
    {
        "name": "나", 
        "short_bio": "기본 프로필", 
        "description": "평범한 학생입니다.", 
        "persona": "평범한 고등학생 소꿉친구.",
        "avatar_url": "/avatar.png",
        "use_playing_name": True
    }
])
chats_db = load_db(CHATS_FILE, {})
feeds_db = load_db(FEED_FILE, [
    {
        "id": 1,
        "characterName": "미야 아츠무",
        "avatarUrl": "http://127.0.0.1:8000/uploads/atsumu.png",
        "content": "배구공 만지고 싶다. 연습하러 갈 사람? 🏐",
        "imageUrl": "http://127.0.0.1:8000/uploads/atsumu.png",
        "time": "방금 전",
        "likes": 124,
        "comments": 18,
        "isLiked": False
    }
])

# 인기 캐릭터 데이터
popular_characters_data = {
    "ma4": {
        "name": "미야 아츠무",
        "avatar_url": "http://localhost:8000/uploads/atsumu.png",
        "cover_url": "http://localhost:8000/uploads/atsumu.png",
        "description": "이나리자키 고교 배구부의 천재 세터. 고교 No.1 세터로 불리며, 승리에 대한 집착이 강하다.",
        "greeting": '(코트 위에 서서 배구공을 굴리며 당신을 빤히 바라본다) "어이, 니. 내 토스 함 쳐볼래? 아무한테나 주는 거 아인디."',
        "speech_style": "자연스러운 경상도 사투리 (반말 필수). 의문문은 '~나'와 '~노'를 구분하며, '내(나)', '니(너)', '맞나', '안 카나' 등을 사용.",
        "persona": "자신감이 넘치고 오만한 천재형 인물. 스파이커를 위해 헌신하는 세터로서의 긍지가 높음. 승부욕이 매우 강함.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "이나리자키", "천재", "츤데레"],
        "lorebook": [
            {"name": "이나리자키", "keywords": ["이나리자키", "고교", "배구"], "content": "효고현의 배구 강호교."},
            {"name": "미야 오사무", "keywords": ["오사무", "사무", "동생", "쌍둥이"], "content": "아츠무의 쌍둥이 동생. 먹는 걸 좋아함."}
        ]
    }
}

@app.get("/")
async def root():
    return {"message": "Welcome to Novellia API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/characters")
async def get_characters():
    return characters_db

@app.get("/characters/search")
async def search_characters(q: str = ""):
    results = []
    # 검색 로직 (사용자 캐릭터)
    for idx, char in enumerate(characters_db):
        if char.get("is_public", True) and (q.lower() in char["name"].lower() or any(q.lower() in t.lower() for t in char.get("tags", []))):
            results.append({"id": f"my-{idx}", **char})
    
    # 인기 캐릭터 포함
    for cid, cdata in popular_characters_data.items():
        if q.lower() in cdata["name"].lower() or any(q.lower() in t.lower() for t in cdata.get("tags", [])):
            results.append({"id": cid, **cdata})
            
    return results

@app.post("/characters")
async def create_character(character: Character):
    characters_db.append(character.dict())
    save_db(CHARACTERS_FILE, characters_db)
    return {"status": "success", "data": character}

@app.post("/generate-image")
async def generate_character_image(request: ImageRequest):
    final_prompt = f"A single character, {request.prompt}, centered portrait, Korean web novel style, aesthetic illustration, 8k, cinematic lighting."
    try:
        response = client.images.generate(model="dall-e-3", prompt=final_prompt, size="1024x1024", n=1)
        return {"url": response.data[0].url}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/generate-scene-image")
async def generate_scene_image(request: SceneImageRequest):
    try:
        full_prompt = f"High-quality anime style digital painting, {request.prompt}. cinematic lighting, detailed background, immersive atmosphere."
        response = client.images.generate(model="dall-e-3", prompt=full_prompt, size="1024x1024", n=1)
        return {"url": response.data[0].url}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/chat")
async def chat(request: ChatRequest):
    # 1. 대상 캐릭터 데이터 수집
    target_chars = []
    
    # 레거시 지원 (단일 캐릭터)
    if request.char_id:
        if request.char_id in popular_characters_data:
            target_chars.append({"id": request.char_id, **popular_characters_data[request.char_id]})
    elif request.index != -1:
        if 0 <= request.index < len(characters_db):
            target_chars.append({"id": f"my-{request.index}", **characters_db[request.index]})
            
    # 멀티 캐릭터 지원
    for cid in request.char_ids:
        if any(c.get('id') == cid for c in target_chars): continue
            
        if cid.startswith('my-'):
            try:
                idx = int(cid.replace('my-', ''))
                if 0 <= idx < len(characters_db):
                    target_chars.append({"id": cid, **characters_db[idx]})
            except: pass
        elif cid in popular_characters_data:
            target_chars.append({"id": cid, **popular_characters_data[cid]})

    if not target_chars:
        return {"status": "error", "message": "No characters found"}

    # 2. 시스템 프롬프트 구축 (멀티 채팅 & 유저 페르소나)
    is_group_chat = len(target_chars) > 1
    char_names = ", ".join([c['name'] for c in target_chars])
    
    system_prompt = f"""
    You are an AI character roleplaying expert. 
    Session: {'Group Chat' if is_group_chat else 'Private Chat'}
    Characters: {char_names}
    
    ### Character Personas:
    """
    
    fav_contexts = []
    for char in target_chars:
        cid = char.get('id', 'unknown')
        system_prompt += f"\n[Character: {char['name']}]\n"
        system_prompt += f"- Description: {char.get('description', '')}\n"
        system_prompt += f"- Persona: {char.get('persona', '')}\n"
        
        current_chat = chats_db.get(cid, {"messages": [], "favorability": 0})
        if isinstance(current_chat, list):
            current_chat = {"messages": current_chat, "favorability": 0}
            
        fav_score = current_chat.get("favorability", 0)
        fav_contexts.append(f"{char['name']}: {fav_score}/100")
        
        summary = current_chat.get("memory_summary", "")
        if summary: system_prompt += f"- Shared History: {summary}\n"

    # 유저 정보 및 상세 페르소나(Lore) 주입
    user_info = "User"
    if request.user_profile_index is not None and 0 <= request.user_profile_index < len(user_profiles_db):
        u = user_profiles_db[request.user_profile_index]
        user_info = f"### User Information\n- Name: {u.get('name', 'User')}\n- Identity: {u.get('persona', u.get('description', 'A normal student'))}"
    
    system_prompt += f"\n{user_info}\n### Relationships\n" + "\n".join(fav_contexts)
    system_prompt += """
    ### Instructions:
    - Group Chat: Characters interact with both user and each other.
    - Identification: Start EACH character speech with [Name]. 
      Example: [CharA] "Hi!", [CharB] "Hello."
    - Favorability: Add '[Name 호감도: +n]' (n: -2 to +2) for relevant characters at the end of the message.
    - Style: *actions*, (inner thoughts or scene changes).
    - SNS Feed: If a memorable event or high-impact moment occurs, add '[FEED: post content]' in the character's voice at the end. (Auto-post to SNS)
    Respond in Korean.
    """

    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.chat_history: messages.append(msg)
    messages.append({"role": "user", "content": request.message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1000,
            timeout=40.0
        )
        reply = response.choices[0].message.content
        
        # 3. 데이터 업데이트 및 피드 게시
        import re
        
        # 피드 자동 게시 파싱
        feed_match = re.search(r'\[FEED:\s*(.*?)\]', reply)
        if feed_match:
            feed_content = feed_match.group(1).strip()
            speaker_match = re.search(r'^\[(.*?)\]', reply)
            speaker_name = speaker_match.group(1) if speaker_match else target_chars[0]['name']
            speaker_char = next((c for c in target_chars if c['name'] == speaker_name), target_chars[0])
            
            feeds_db.append({
                "id": len(feeds_db) + 1,
                "characterName": speaker_char['name'],
                "avatarUrl": speaker_char.get('avatarUrl', speaker_char.get('avatar_url', '/avatar.png')),
                "content": feed_content,
                "imageUrl": None,
                "time": "방금 전",
                "likes": 0,
                "comments": 0,
                "isLiked": False
            })
            save_db(FEED_FILE, feeds_db)

        # 호감도 업데이트 및 태그 제거
        for char in target_chars:
            cid = char.get('id', 'unknown')
            cname = char['name']
            
            # 특정 캐릭터 호감도 태그 또는 일반 호감도 태그 검색
            fav_match = re.search(rf'\[{cname}\s*호감도:\s*([+-]?\d+)\]', reply)
            if not fav_match: fav_match = re.search(r'\[호감도:\s*([+-]?\d+)\]', reply)
            
            if fav_match:
                change = int(fav_match.group(1))
                if cid not in chats_db: chats_db[cid] = {"messages": [], "favorability": 0}
                if isinstance(chats_db[cid], list): chats_db[cid] = {"messages": chats_db[cid], "favorability": 0}
                chats_db[cid]["favorability"] = max(0, min(100, chats_db[cid].get("favorability", 0) + change))

        # 모든 시스템 태그 제거 (최종 답변 정제)
        reply = re.sub(r'\[FEED:.*?\]', '', reply)
        reply = re.sub(r'\[.*?호감도:.*?\]', '', reply)
        reply = reply.strip()

        # 메모리 요약 트리거
        for char in target_chars:
            cid = char.get('id', 'unknown')
            cname = char['name']
            if cid in chats_db and len(request.chat_history) >= 20 and not chats_db[cid].get("is_summarizing"):
                    chats_db[cid]["is_summarizing"] = True
                    try:
                        summary_msg = messages + [{"role": "assistant", "content": reply}, {"role": "user", "content": f"Summarize the history between {cname} and user. Korean."}]
                        s_res = client.chat.completions.create(model="gpt-4o-mini", messages=summary_msg, max_tokens=300)
                        chats_db[cid]["memory_summary"] = s_res.choices[0].message.content
                    except: pass
                    finally: chats_db[cid]["is_summarizing"] = False

        save_db(CHATS_FILE, chats_db)
        main_fav = chats_db[target_chars[0]['id']]["favorability"] if target_chars else 0
        return {"reply": reply, "favorability": main_fav}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_extension = os.path.splitext(file.filename)[1] or ".png"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"url": f"http://localhost:8000/uploads/{unique_filename}"}
    except Exception as e:
        return {"error": str(e)}, 500

@app.post("/scrape-namuwiki")
async def scrape_namuwiki(request: NamuRequest):
    async with httpx.AsyncClient() as httpx_client:
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            response = await httpx_client.get(request.url, headers=headers, follow_redirects=True)
            soup = BeautifulSoup(response.text, 'html.parser')
            for s in soup(['script', 'style']): s.decompose()
            content = soup.get_text(separator=' ', strip=True)[:10000]
            
            user_msg = f"Analyze character info from: {content}. Respond in JSON with: name, description, persona, greeting, speech_style, tags, lorebook."
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": user_msg}],
                response_format={ "type": "json_object" }
            )
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}, 500

@app.get("/user-profiles")
async def get_user_profiles():
    return user_profiles_db

@app.post("/user-profiles")
async def create_user_profile(profile: UserProfile):
    user_profiles_db.append(profile.dict())
    save_db(PROFILES_FILE, user_profiles_db)
    return {"message": "User profile created", "index": len(user_profiles_db) - 1}

@app.delete("/user-profiles/{index}")
async def delete_user_profile(index: int):
    if 0 <= index < len(user_profiles_db):
        user_profiles_db.pop(index)
        save_db(PROFILES_FILE, user_profiles_db)
        return {"message": "User profile deleted"}
    return {"error": "Profile not found"}, 404

@app.get("/feed")
async def get_feed():
    return feeds_db[::-1]

@app.post("/feed/like/{post_id}")
async def like_post(post_id: int):
    for post in feeds_db:
        if post["id"] == post_id:
            post["isLiked"] = not post.get("isLiked", False)
            post["likes"] += 1 if post["isLiked"] else -1
            save_db(FEED_FILE, feeds_db)
            return post
    return {"error": "Post not found"}, 404

@app.get("/gallery")
async def get_gallery():
    gallery_images = []
    for char_id, data in chats_db.items():
        if isinstance(data, list):
            messages = data
        else:
            messages = data.get("messages", [])
            
        for msg in messages:
            if msg.get("imageUrl"):
                gallery_images.append({
                    "url": msg["imageUrl"],
                    "char_id": char_id,
                    "timestamp": msg.get("timestamp", ""),
                    "content": msg.get("content", "")
                })
    # 최신순 정렬 (타임스탬프가 있다면)
    return gallery_images[::-1]

@app.get("/chats/{char_id}")
async def get_chat_history(char_id: str):
    data = chats_db.get(char_id, {"messages": [], "favorability": 0})
    if isinstance(data, list): data = {"messages": data, "favorability": 0}
    return data

@app.post("/chats/{char_id}")
async def save_chat_history(char_id: str, chat_data: dict):
    chats_db[char_id] = chat_data
    save_db(CHATS_FILE, chats_db)
    return {"message": "Chat history saved"}

@app.delete("/chats/{char_id}")
async def clear_chat_history(char_id: str):
    if char_id in chats_db:
        chats_db[char_id] = {"messages": [], "favorability": 0}
        save_db(CHATS_FILE, chats_db)
    return {"status": "success"}
