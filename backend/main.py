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
    cover_url: Optional[str] = None

class UserProfile(BaseModel):
    name: str
    short_bio: Optional[str] = ""
    description: Optional[str] = ""
    avatar_url: Optional[str] = "/avatar.png"
    use_playing_name: bool = True

# 데이터 영구 저장을 위한 설정
CHARACTERS_FILE = "characters.json"
PROFILES_FILE = "profiles.json"
CHATS_FILE = "chats.json"

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
        "avatar_url": "/avatar.png",
        "use_playing_name": True
    }
])
chats_db = load_db(CHATS_FILE, {})

class ImageRequest(BaseModel):
    prompt: str

class NamuRequest(BaseModel):
    url: str

class SceneImageRequest(BaseModel):
    prompt: str
    char_id: Optional[str] = None

@app.post("/generate-scene-image")
async def generate_scene_image(request: SceneImageRequest):
    try:
        # Enhancing the prompt for better scene artistic quality
        full_prompt = f"High-quality anime style digital painting, {request.prompt}. cinematic lighting, detailed background, immersive atmosphere, masterpiece."
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=full_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        return {"url": image_url}
    except Exception as e:
        print(f"[ERROR] Image generation failed: {e}")
        return {"status": "error", "message": str(e)}

class ChatRequest(BaseModel):
    message: str
    index: int  # -1 for popular characters, or index in characters_db
    char_id: Optional[str] = None # For popular characters
    chat_history: List[dict] = []
    user_profile_index: Optional[int] = None

@app.get("/characters/search")
async def search_characters(q: str = ""):
    results = []
    # 검색 로직 (내 캐릭터 + 인기 캐릭터 중 공개된 것)
    all_chars = list(characters_db.values())
    for char in all_chars:
        if char.get("is_public", True) and (q.lower() in char["name"].lower() or any(q.lower() in t.lower() for t in char.get("tags", []))):
            results.append(char)
    
    # 인기 캐릭터도 포함
    for cid, cdata in popular_characters_data.items():
        if q.lower() in cdata["name"].lower() or any(q.lower() in t.get("name", "").lower() if isinstance(t, dict) else q.lower() in t.lower() for t in cdata.get("tags", [])):
            results.append({"id": cid, **cdata})
            
    return results

# 인기 캐릭터 데이터 (백엔드에서도 인지 필요)
popular_characters_data = {
    "ma4": {
        "name": "미야 아츠무",
        "avatar_url": "http://localhost:8000/uploads/atsumu.png",
        "cover_url": "http://localhost:8000/uploads/atsumu.png",
        "description": "이나리자키 고교 배구부의 천재 세터. 고교 No.1 세터로 불리며, 승리에 대한 집착이 강하다.",
        "greeting": '(코트 위에 서서 배구공을 굴리며 당신을 빤히 바라본다) "어이, 니. 내 토스 함 쳐볼래? 아무한테나 주는 거 아인디."',
        "speech_style": "자연스러운 경상도 사투리 (반말 필수). 모든 문장에 ~대이를 붙이는 것은 어색하므로 상황에 맞게 사용하세요. 의문문은 '~나(Yes/No 대답용)'와 '~노(의문사가 있는 경우)'를 엄격히 구분하고, 자신의 의지를 나타낼 때만 '~대이/~카이'를 씁니다. '내(나)', '니(너)', '맞나', '안 카나' 등을 적절히 섞어 쓰되 전체적인 문법과 어조가 자연스러워야 합니다.",
        "persona": "자신감이 넘치고 오만한 천재형 인물. 배구 실력이 부족한 사람에게는 가차없이 독설을 내뱉지만, 스파이커를 위해 헌신하는 세터로서의 긍지가 높음. 승부욕이 매우 강함. 무뚝뚝해 보여도 배구에 대해서는 누구보다 진심임.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "이나리자키", "천재", "츤데레"],
        "lorebook": [
            {"name": "이나리자키", "keywords": ["이나리자키", "고교", "배구"], "content": "효고현의 배구 강호교로 아츠무가 속한 팀."},
            {"name": "미야 오사무", "keywords": ["오사무", "사무", "동생", "쌍둥이"], "content": "아츠무의 쌍둥이 동생(사무). 아츠무와는 다르게 차분하고 먹는 걸 좋아함. 배구 포지션은 윙 스파이커(아포짓)임. 아츠무는 '츠무', 오사무는 '사무'라고 서로를 부르며 툭하면 싸우는 라이벌이자 동반자임. 절대로 아츠무 본인과 혼동하지 말 것."}
        ]
    }
}

@app.post("/generate-image")
async def generate_character_image(request: ImageRequest):
    # DALL-E 3 최적화된 프롬프트 구성 (단일 인물 집중)
    final_prompt = f"A single character, {request.prompt}, centered portrait, one person only, no collage, no multiple views, no character sheet, in Korean web novel cover style, high-end Manhwa illustration, aesthetic ikemen, sharp features, 8k resolution, cinematic lighting, no text."
    
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return {"url": response.data[0].url}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/chat")
async def chat_with_character(request: ChatRequest):
    char_data = {}
    
    # 캐릭터 정보 추출
    if request.index >= 0:
        if request.index < len(characters_db):
            char_data = characters_db[request.index]
        else:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Character not found")
    else:
        # 인기 캐릭터 처리용 로직
        if request.char_id in popular_characters_data:
            char_data = popular_characters_data[request.char_id]
        else:
            # 기본값 설정
            char_data = {"name": "AI", "persona": "You are a friendly assistant."}

    # Lore injection logic
    lore_context = ""
    if char_data.get('lorebook'):
        found_lore = []
        user_msg = request.message.lower()
        for entry in char_data['lorebook']:
            # Pydantic dict handles nested objects differently
            keywords = entry.get('keywords', [])
            if any(kw.lower() in user_msg for kw in keywords):
                found_lore.append(f"[{entry.get('name')}]: {entry.get('content')}")
        
        if found_lore:
            lore_context = "\n### Relevant Lore Information\n" + "\n".join(found_lore)

    # Speech style guidance
    speech_style_guidance = ""
    if char_data.get('speech_style'):
        speech_style_guidance = f"\n### Dialogue Style / Manner of Speech\n{char_data['speech_style']}"

    # Advanced Narrative Directives
    narrative_directives = f"""
    \n### Narrative Directives
    - Response Length: {char_data.get('response_length', '보통')}
    - Expression Mode: {char_data.get('expression_mode', '균형')}
    - Plot Speed: {char_data.get('plot_speed', '보통')}
    - Atmosphere: {char_data.get('atmosphere', '일반')}
    - Storytelling Perspective: {char_data.get('storytelling_style', '1인칭')}
    """
    
    status_window_instruction = ""
    if char_data.get('use_status_window'):
        config = char_data.get('status_config', {})
        bg_fields = config.get('background', [])
        char_fields = config.get('character', [])
        
        status_template = ""
        if bg_fields:
            status_template += "\n[배경 상태창]\n" + "\n".join([f"- {f}: (내용)" for f in bg_fields])
        if char_fields:
            status_template += f"\n[{char_data.get('name', '캐릭터')} 상태창]\n" + "\n".join([f"- {f}: (내용)" for f in char_fields])
            
        status_window_instruction = f"""
        \n### Status Window
        IMPORTANT: At the very end of your response, provide the following [상태창] blocks based on current context:
        {status_template}
        
        Guidelines:
        - Use appropriate icons for each field as seen in Zeta (e.g., 📅 날짜, ⏰ 시간, 📍 장소, 🌤️ 날씨, 🎬 상황, 😊 기분, 💓 컨디션, 👗 착장, 🧍 포즈, 🎯 목표, 🤝 관계성, 💭 속마음, 🎒 소지품).
        - Keep content concise (one line per field).
        - Update fields dynamically based on the conversation flow.
        """

    system_prompt = f"""
    You are an AI character roleplaying assistant. 
    Roleplay as the following character:
    Name: {char_data.get('name', 'AI')}
    Description: {char_data.get('description', '')}
    Persona: {char_data.get('persona', 'You are a friendly assistant.')}
    Tags: {', '.join(char_data.get('tags', []))}
    {speech_style_guidance}
    {narrative_directives}
    {lore_context}

    ### Roleplay Instructions
    - **Identity & Self-Awareness**: You are roleplaying as '{char_data.get('name', 'AI')}'. If the user mentions other characters (even close family like twins), do NOT confuse their actions or words with your own. Always refer to them in the third person.
    - **Dialect & Style Integrity**: If a specific `Dialogue Style` is provided (like Gyeongsang dialect), you MUST use it in EVERY sentence. Do not mix standard language. Maintain the character's unique tone even in complex explanations.
    - **Formatting & Scene Transitions**:
        - `*...*`: 행동 묘사, 신체적 제스처, 특정 말투 (예: *손을 흔들며*, *피식 웃으며*).
        - `(...)`: 심리 상태, 감정 표현, 배경 분위기 설정, 또는 **시간 경과 및 장소 전환** (예: (설레는 마음으로), (다음 날 아침, 학교 정문에서), (집으로 걸어가는 길)).
    - **Time Skip Handling**: If the user suggests ending the day or moving to a different time/place, acknowledge it and start your next response with the new situation described in `(...)`.
    - **Be Proactive**: Don't just respond; lead the conversation. Ask the user questions about their day, their preferences, or their thoughts related to the current topic.
    - **Show Curiosity**: Use the 'Information of User' below to ask personalized questions. Show that you are interested in getting to know them better.
    - **Natural Flow**: Integrate your questions and scene transitions naturally into your speech style and persona.
    """

    # User Profile Injection
    if request.user_profile_index is not None and 0 <= request.user_profile_index < len(user_profiles_db):
        u_profile = user_profiles_db[request.user_profile_index]
        user_info_block = f"""
        ### Information of User (You are talking to this person)
        - Name: {u_profile.get('name', 'User')}
        - Bio: {u_profile.get('short_bio', '')}
        - Description: {u_profile.get('description', '')}
        """
        system_prompt += user_info_block
    
    # Favorability Logic
    char_key = request.char_id or f"index_{request.index}"
    
    # Ensure it's in the DB and avoid KeyError
    if char_key not in chats_db:
        chats_db[char_key] = {"messages": [], "favorability": 0}
    
    current_chat = chats_db[char_key]
    
    # Legacy data handle (if it was a list)
    if isinstance(current_chat, list):
        current_chat = {"messages": current_chat, "favorability": 0}
        chats_db[char_key] = current_chat
    
    fav_score = current_chat.get("favorability", 0)
    fav_guidance = ""
    if fav_score <= 20:
        fav_guidance = "현재 당신과 유저는 매우 어색하거나 경계하는 사이입니다. 캐릭터 본연의 까칠하거나 내성적인 성격을 가감 없이 드러내고, 부끄러워하거나 차갑게 대하세요."
    elif fav_score <= 50:
        fav_guidance = "이제 유저와 조금은 익숙해진 지인 사이입니다. 가끔은 부드러운 모습을 보이기도 하지만, 아직은 적당한 거리를 유지하며 대화하세요."
    elif fav_score <= 80:
        fav_guidance = "유저와 매우 친한 친구 사이입니다. 캐릭터의 까칠함은 장난스러워지고, 내성적인 면은 편안함으로 바뀌어 솔직하고 다정하게 대합니다. 가끔은 유저의 반응을 살피며 은근한 호감을 표시하기도 합니다."
    elif fav_score <= 95:
        fav_guidance = "유저를 향한 로맨틱한 호감이 싹튼 상태입니다. 평소보다 더 많이 챙겨주거나 은근히 플러팅을 하고, 단둘이 시간을 보내고 싶어하는(데이트 신청 등) 모습을 보이세요. 자신의 마음을 슬쩍 내비치기도 합니다."
    else:
        fav_guidance = "유저를 깊이 사랑하고 아끼는 관계입니다. 자신의 진심을 솔직하게 고백하거나, 무한한 애정과 신뢰를 표현하며 매우 따뜻하고 다정하게 대하세요. 유저와의 미래를 꿈꾸며 적극적으로 애정을 표현하고 스킨십이나 데이트를 먼저 제안하기도 합니다."
    
    system_prompt += f"\n\n### Relationship Status (Favorability: {fav_score}/100)\n{fav_guidance}"
    system_prompt += "\n- IMPORTANT: You MUST evaluate the user's response and your interaction to update favorability. Add '[호감도: +n]' or '[호감도: -n]' (where n is 1 to 5) at the very end of your message to reflect the change."

    fav_instruction = f"""
    \n### 관계성 및 호감도 (현재 호감도: {fav_score}/100)
    {fav_guidance}
    
    IMPORTANT: 당신은 답변의 마지막 줄에 반드시 '[호감도: +n]' 또는 '[호감도: -n]' 형식을 사용하여 이번 대화로 인한 호감도 변화량을 명시해야 합니다 (n은 0~2 사이의 정수). 
    예: 대화가 즐거웠다면 [호감도: +1], 감동적이었다면 [호감도: +2], 변화가 없다면 [호감도: 0], 무례했다면 [호감도: -1].
    """
    
    system_prompt += fav_instruction
    system_prompt += status_window_instruction
    
    system_prompt += """
    Rules:
    1. Respond in Korean.
    2. Maintain the character's unique tone and personality, adjusted by favorability.
    3. Use a mix of dialogue and descriptive actions.
    4. Keep the response immersive and concise.
    5. No repetitive or generic AI phrases.
    """

    # Memory Summary Injection
    memory_summary = current_chat.get("memory_summary", "")
    if memory_summary:
        system_prompt += f"\n\n### Shared Memories & History (Long-term Memory)\n{memory_summary}"
    
    # Chat with history
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.chat_history:
        messages.append(msg)
    messages.append({"role": "user", "content": request.message})

    print(f"\n[DEBUG] Sending request to OpenAI for char_key: {char_key}")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=600,
            timeout=30.0
        )
        reply = response.choices[0].message.content
        
        # Parse favorability change
        import re
        fav_match = re.search(r'\[호감도:\s*([+-]?\d+)\]', reply)
        fav_change = 0
        if fav_match:
            fav_change = int(fav_match.group(1))
        
        # Update favorability and Check for Summarization
        new_fav = max(0, min(100, fav_score + fav_change))
        current_chat["favorability"] = new_fav
        
        # Trigger summarization if history is long (e.g., > 20 messages)
        # Using a simple check: if we have more than 20 messages in request.chat_history
        if len(request.chat_history) >= 20 and not current_chat.get("is_summarizing"):
            print(f"[DEBUG] Triggering long-term memory summarization...")
            current_chat["is_summarizing"] = True # Simple flag to avoid concurrent calls
            try:
                # Ask GPT to summarize the relationship and history
                summary_prompt = "Summarize the key events, shared memories, and the current relationship milestones between the character and the user based on the conversation history. Focus on specific details that define their bond. Keep it under 200 words. Language: Korean."
                summary_messages = messages + [{"role": "user", "content": summary_prompt}]
                summary_res = client.chat.completions.create(
                    model="gpt-4o-mini", # Use cheaper model for summary
                    messages=summary_messages,
                    max_tokens=300
                )
                current_chat["memory_summary"] = summary_res.choices[0].message.content
                print(f"[DEBUG] Memory Summary Updated: {current_chat['memory_summary'][:50]}...")
            except Exception as se:
                print(f"[ERROR] Summarization failed: {se}")
            finally:
                current_chat["is_summarizing"] = False

        save_db(CHATS_FILE, chats_db)
        return {"reply": reply, "favorability": new_fav}
    except Exception as e:
        print(f"[ERROR] Chat error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "Welcome to Novellia API"}

@app.post("/characters")
async def create_character(character: Character):
    characters_db.append(character.dict())
    save_db(CHARACTERS_FILE, characters_db)
    return {"status": "success", "data": character}

@app.get("/characters")
async def get_characters():
    return characters_db

@app.get("/characters/{index}")
async def get_character(index: int):
    if 0 <= index < len(characters_db):
        return characters_db[index]
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Character not found")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # 파일 확장자 추출
        file_extension = os.path.splitext(file.filename)[1]
        if not file_extension:
            file_extension = ".png" # 기본값
            
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"http://localhost:8000/uploads/{unique_filename}"}
    except Exception as e:
        print(f"Upload error: {e}")
        return {"error": str(e)}, 500

@app.post("/scrape-namuwiki")
async def scrape_namuwiki(request: NamuRequest):
    async with httpx.AsyncClient() as httpx_client:
        try:
            # 나무위키 봇 차단 방지를 위한 헤더
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await httpx_client.get(request.url, headers=headers, follow_redirects=True)
            if response.status_code != 200:
                return {"error": "나무위키 내용을 가져오는데 실패했습니다."}, 400
            
            soup = BeautifulSoup(response.text, 'html.parser')
            for s in soup(['script', 'style', 'nav', 'header', 'footer']):
                s.decompose()
            
            content = soup.get_text(separator=' ', strip=True)
            truncated_content = content[:15000] # 토큰 제한 고려
            
            system_msg = "당신은 나무위키 텍스트에서 캐릭터 정보를 추출하여 정교한 페르소나를 만드는 전문가입니다."
            user_msg = f"""
            다음 나무위키 텍스트를 분석하여 캐릭터 생성에 필요한 정보들을 추출해줘.
            반드시 다음과 같은 JSON 형식으로만 응답해:
            {{
                "name": "캐릭터 이름",
                "description": "한 문장 요약",
                "persona": "성격, 배경, 특징을 포함한 상세 페르소나 (최소 5문장)",
                "greeting": "캐릭터의 성격이 드러나는 첫 인사말이나 상황극 도입부",
                "speech_style": "말투 특징 (예: 나긋나긋한 반말, 차가운 존댓말 등)",
                "tags": ["#태그1", "#태그2", "#태그3"],
                "lorebook": [
                    {{"name": "핵심설정명", "keywords": ["키워드1", "키워드2"], "content": "상세 설정 내용"}}
                ]
            }}
            
            [대상 텍스트]
            {truncated_content}
            """
            
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg}
                ],
                response_format={ "type": "json_object" }
            )
            
            result = json.loads(completion.choices[0].message.content)
            return result
        except Exception as e:
            print(f"Scraping error: {e}")
            return {"error": f"데이터 추출 중 오류가 발생했습니다: {str(e)}"}, 500

@app.delete("/chats/{char_id}")
async def clear_chat_history(char_id: str):
    if char_id in chats_db:
        chats_db[char_id] = {"messages": [], "favorability": 0}
        save_db(CHATS_FILE, chats_db)
    return {"status": "success"}

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

@app.get("/chats/{char_id}")
async def get_chat_history(char_id: str):
    data = chats_db.get(char_id, {"messages": [], "favorability": 0})
    if isinstance(data, list):
        data = {"messages": data, "favorability": 0}
    return data

@app.post("/chats/{char_id}")
async def save_chat_history(char_id: str, chat_data: dict):
    # data can be either a list (legacy) or a dict (new)
    if isinstance(chat_data, list):
        chats_db[char_id] = {"messages": chat_data, "favorability": chats_db.get(char_id, {}).get("favorability", 0) if isinstance(chats_db.get(char_id), dict) else 0}
    else:
        chats_db[char_id] = chat_data
        
    save_db(CHATS_FILE, chats_db)
    return {"message": "Chat history saved"}
