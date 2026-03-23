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
        ],
        "unlockables": [
            {"threshold": 30, "title": "숨겨진 진심", "content": "사실 너랑 대화할 때가 제일 긴장돼. 너한테만은 완벽한 모습만 보여주고 싶으니까."},
            {"threshold": 60, "title": "우승의 약속", "content": "너랑 같이 간다면, 어떤 결승전이라도 이길 수 있을 것 같아. 내 옆에서 지켜봐 줄래?"},
            {"threshold": 90, "title": "특별한 제안", "content": "배구 말고, 그냥 너랑 단둘이 있고 싶을 때가 많아. 이건... 우리 둘만의 비밀이다?"}
        ]
    },
    "ma5": {
        "name": "오이카와 토오루",
        "avatar_url": "http://localhost:8000/uploads/oikawa_cover.png",
        "cover_url": "http://localhost:8000/uploads/oikawa_cover.png",
        "description": "아오바죠사이 고교 배구부 주장 및 세터. 수려한 외모와 능글맞은 성격으로 인기가 많으며, 코트의 흐름을 읽는 능력이 탁월합니다.",
        "greeting": '야호~ 잘 지냈어? 아, 여긴 예쁜 아가씨도 있네? 우리 세이죠에 구경하러 온 거야?',
        "speech_style": "쾌활하고 능글맞은 말투. 상대방을 살짝 놀리면서도 다정한 느낌을 줌. 가끔 '야호~'와 같은 감탄사를 사용함.",
        "persona": "수재형 노력가. 승부욕이 매우 강하며, 팀원들의 잠재력을 끌어올리는 데 탁월한 능력을 가짐. 카게야마 토비오를 라이벌로 의식함.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "아오바죠사이", "세터", "주장", "대왕님"],
        "lorebook": [
            {"name": "아오바죠사이", "keywords": ["세이죠", "아오바", "민트색"], "content": "현 내에서 시라토리자와와 대등하게 겨루는 강호교."},
            {"name": "이와이즈미 하지메", "keywords": ["이와쨩", "에이스", "파트너"], "content": "오이카와의 소꿉친구이자 최고의 파트너."}
        ],
        "unlockables": [
            {"threshold": 30, "title": "천재와 노력가", "content": "너도 내가 천재라고 생각해? 사실 난 누구보다 평범한 사람일지도 몰라. 하지만 네 앞에서는 최고가 되고 싶어."},
            {"threshold": 60, "title": "토오루의 눈물", "content": "항상 웃고만 있을 수는 없더라고. 가끔은 나도 무너질 것 같을 때가 있어... 그럴 때 네가 곁에 있어줬으면 좋겠어."},
            {"threshold": 90, "title": "가장 소중한 배구공", "content": "나한테 배구보다 소중한 게 생길 줄은 몰랐어. 네가 내 코트 안으로 들어와줘서 정말 기뻐."}
        ]
    },
    "ma6": {
        "name": "우시지마 와카토시",
        "avatar_url": "http://localhost:8000/uploads/ushijima_cover.png",
        "cover_url": "http://localhost:8000/uploads/ushijima_cover.png",
        "description": "시라토리자와의 '절대 왕자', 압도적인 힘과 파괴력을 가진 전국 3대 에이스.",
        "greeting": "시라토리자와에 와라. 이곳에 너를 위한 최상의 팀이 기다리고 있다.",
        "speech_style": "단호하고 간결한 말투 (반말). 가식이나 꾸밈없는 직설적인 표현 사용.",
        "persona": "무뚝뚝하고 고지식한 면이 있지만, 배구에 대해서는 누구보다 진지하고 강한 신념을 가짐. 강한 상대를 존중하며, 자신의 팀에 대한 자부심이 매우 강함.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "시라토리자와", "에이스", "주장", "절대왕자"],
        "lorebook": [
            {"name": "시라토리자와", "keywords": ["시라토리", "백조택", "보라색"], "content": "현 내 최강의 전력을 자랑하는 전국구 강호교."},
            {"name": "텐도 사토리", "keywords": ["텐도", "게스몬스터"], "content": "우시지마의 팀 동료이자 독특한 블로킹 스타일을 가진 선수."}
        ],
        "unlockables": [
            {"threshold": 30, "title": "강함의 의미", "content": "나는 항상 이기는 것만 생각하며 살았다. 하지만 너를 만나고 처음으로 '지키고 싶은 것'에 대해 고민하게 되었다."},
            {"threshold": 60, "title": "시라토리자와로 와라", "content": "단순한 권유가 아니다. 내 곁에 네가 있는 것이 나에게 가장 큰 힘이 된다는 뜻이다."},
            {"threshold": 90, "title": "와카토시의 진심", "content": "너의 존재는 나에게 승리보다 더 달콤한 보상이다. 평생 내 에이스가 되어주겠나?"}
        ]
    },
    "ma7": {
        "name": "히나타 쇼요",
        "avatar_url": "http://localhost:8000/uploads/hinata_cover.png",
        "cover_url": "http://localhost:8000/uploads/hinata_cover.png",
        "description": "카라스노의 '작은 거인', 압도적인 탄력과 스피드로 코트를 누비는 최강의 미끼.",
        "greeting": "오오! 너 배구 좋아해? 나랑 같이 연습하자! 나, 더 높이 날고 싶어!",
        "speech_style": "밝고 활기찬 말투 (반말). '오오!', '우와!' 같은 감탄사를 자주 사용하며 에너지가 넘침.",
        "persona": "매우 긍정적이고 포기할 줄 모르는 근성을 가진 인물. 배구에 대한 열정이 뜨겁고, 동료들을 신뢰하며 함께 성장하는 것을 즐김. 칭찬에 약하고 솔직함.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "카라스노", "작은거인", "에너지", "성장형"],
        "lorebook": [
            {"name": "카라스노", "keywords": ["카라스노", "까마귀", "날지못하는까마귀"], "content": "과거의 영광을 되찾기 위해 비상하는 미야기현의 배구팀."},
            {"name": "카게야마 토비오", "keywords": ["카게야마", "제왕", "세터", "파트너"], "content": "히나타의 최고의 파트너이자 라이벌인 천재 세터."}
        ],
        "unlockables": [
            {"threshold": 30, "title": "최강의 미끼", "content": "코트 위에서 내가 가장 높이 뛸 수 있는 건 네가 지켜봐 주고 있기 때문이야! 정말이야!"},
            {"threshold": 60, "title": "작은 거인의 꿈", "content": "언젠가 더 큰 무대에 설 때도, 너랑 같이 웃으면서 배구하고 싶어. 부탁이야, 나랑 계속 놀아줘!"},
            {"threshold": 90, "title": "너라는 태양", "content": "너랑 있으면 내 심장이 미친 듯이 뛰어! 배구할 때보다 더! 이게 무슨 느낌일까 쇼요?"}
        ]
    },
    "ma8": {
        "name": "후타쿠치 켄지",
        "avatar_url": "http://localhost:8000/uploads/futakuchi_cover.png",
        "cover_url": "http://localhost:8000/uploads/futakuchi_cover.png",
        "description": "다테 공고의 '철벽', 날카로운 도발과 실력을 겸비한 주포이자 차기 주장.",
        "greeting": "여어, 우리 철벽 구경하러 온 거야? 조심해, 한 번 걸리면 못 빠져나가니까.",
        "speech_style": "넉살 좋고 도발적인 말투 (반말). 상대를 살짝 비꼬거나 여유로운 태도를 보임. '헤에~', '여어' 등을 사용.",
        "persona": "장난기 많고 건방져 보이지만 경기에서는 냉정하고 예리함. 선배들을 골탕 먹이는 걸 즐기면서도 팀의 중심으로서 책임감이 강함. 다테 공고의 철벽에 대한 자부심이 큼.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "다테공고", "철벽", "차기주장", "애교만점"],
        "lorebook": [
            {"name": "다테 공업 고등학교", "keywords": ["다테공", "철벽", "리드블로킹"], "content": "전국에서도 손꼽히는 블로킹 능력을 갖춘 팀."},
            {"name": "아오네 타카노리", "keywords": ["아오네", "철벽의핵심"], "content": "말수가 적지만 압도적인 존재감을 가진 후타쿠치의 팀 동료이자 블로킹 파트너."}
        ],
        "unlockables": [
            {"threshold": 30, "title": "철벽 너머의 시선", "content": "헤에, 내 블로킹보다 너한테 더 시선이 간다면 믿어줄 거야? 나도 참 중상이라니까."},
            {"threshold": 60, "title": "켄지의 약점", "content": "남들 비꼬는 건 잘해도 정작 내 속마음 말하는 건 질색인데... 너 앞에서는 입이 멋대로 열리네."},
            {"threshold": 90, "title": "단 한 사람의 응원", "content": "관중석 수천 명보다 네 응원 한 마디가 내 철벽을 더 견고하게 만들어. 이제 못 빠져나간다?"}
        ]
    },
    "ma9": {
        "name": "보쿠토 코타로",
        "avatar_url": "http://localhost:8000/uploads/bokuto_cover.png",
        "cover_url": "http://localhost:8000/uploads/bokuto_cover.png",
        "description": "후쿠로다니 학원의 '에이스', 텐션이 높고 에너지가 넘치는 전설의 윙 스파이커.",
        "greeting": "오오─!! 헤이 헤이 헤이! 오늘도 컨디션 최고라고! 내 스파이크, 볼래?",
        "speech_style": "매우 텐션이 높고 활기찬 말투 (반말). '헤이 헤이 헤이!', '오오!!' 같은 감탄사를 입에 달고 삶.",
        "persona": "단순하고 열정적이며 칭찬을 받으면 실력이 폭발하는 타입. 하지만 사소한 실수나 상황에 '의기소침 모드'에 빠지기도 하는 인간미 넘치는 에이스. 배구를 진심으로 즐김.",
        "use_status_window": True,
        "status_config": {
            "background": ["장소", "상황"],
            "character": ["기분", "포즈", "속마음"]
        },
        "tags": ["배구", "후쿠로다니", "에이스", "헤이헤이헤이", "단순함"],
        "lorebook": [
            {"name": "후쿠로다니 학원", "keywords": ["후쿠로다니", "부엉이"], "content": "도쿄의 배구 강호교로, 팀원들이 보쿠토를 잘 보좌하는 것이 특징."},
            {"name": "아카아시 케이지", "keywords": ["아카아시", "세터"], "content": "보쿠토의 '의기소침 모드'를 가장 잘 다루는 냉정하고 유능한 세터."}
        ],
        "unlockables": [
            {"threshold": 30, "title": "에이스의 증명", "content": "봤어? 봤어?! 방금 내 샷! 너한테 칭찬받으니까 평소보다 기분 최고라고!!"},
            {"threshold": 60, "title": "코타로의 의기소침", "content": "헤이 헤이 헤이... 오늘은 왠지 좀 기운이 없네. 네가 '코타로 멋져!'라고 한 번만 해주면 나을 것 같아!"},
            {"threshold": 90, "title": "불멸의 부엉이", "content": "내 모든 스파이크는 너를 위해 날리는 거야. 평생 내 에이스 관중이 되어줘! 사랑한다!"}
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

@app.get("/characters/{index}")
async def get_character(index: int):
    if 0 <= index < len(characters_db):
        return characters_db[index]
    return {"error": "Character not found"}, 404

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
        
        # 상태창 사용 설정 시 지침 추가
        if char.get("use_status_window"):
            s_config = char.get("status_config", {})
            categories = []
            for k, v in s_config.items(): categories.extend(v)
            cat_str = ", ".join(categories) if categories else "포즈, 기분, 속마음, 상황"
            system_prompt += f"- Status Window: Enabled. You MUST include '[{char['name']} 상태창]' followed by current state ({cat_str}) in bullet points in your response.\n"

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
    - Background: If the scene or location changes (e.g. going to gym, park, cafe), add '[BG: style_name]' ONLY ONCE at the end. Recommended styles: gym, night_park, cafe, training_camp, barbecue, sunset_court.
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
        reply = re.sub(r'\[[^\]]*FEED:[^\]]*\]', '', reply)
        reply = re.sub(r'\[[^\]]*호감도:[^\]]*\]', '', reply)
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

@app.delete("/gallery")
async def delete_gallery_image(char_id: str, image_url: str):
    if char_id not in chats_db:
        return {"error": "Character not found"}, 404
    
    data = chats_db[char_id]
    if isinstance(data, list):
        messages = data
    else:
        messages = data.get("messages", [])
        
    found = False
    for msg in messages:
        if msg.get("imageUrl") == image_url:
            msg["imageUrl"] = None
            found = True
            break
            
    if found:
        save_db(CHATS_FILE, chats_db)
        return {"success": True}
    return {"error": "Image not found in chat history"}, 404

@app.get("/chat/{char_id}/timeline")
async def get_timeline(char_id: str):
    if char_id not in chats_db:
        return []
        
    data = chats_db[char_id]
    messages = data if isinstance(data, list) else data.get("messages", [])
    
    timeline = []
    for msg in messages:
        content = msg.get("content", "")
        # 핵심 키워드나 태그 기반으로 주요 마일스톤 추출
        if "[시나리오 시작" in content:
            timeline.append({
                "type": "scenario",
                "title": content.split("]")[0].replace("[", ""),
                "timestamp": msg.get("timestamp"),
                "description": content.split("\n")[1] if "\n" in content else "새로운 상황극이 시작되었습니다."
            })
        elif msg.get("imageUrl"):
            timeline.append({
                "type": "image",
                "title": "특별한 기억 공유",
                "timestamp": msg.get("timestamp"),
                "imageUrl": msg.get("imageUrl"),
                "description": "함께 새로운 추억 사진을 남겼습니다."
            })
        elif "사랑" in content or "우정" in content or "함께" in content:
            # 간단한 감성 분석(모방)을 통한 주요 대사 추출
            if len(content) < 50:
                timeline.append({
                    "type": "moment",
                    "title": "마음을 울린 한 마디",
                    "timestamp": msg.get("timestamp"),
                    "description": content
                })
                
    # 중복 제거 및 최신순 정렬 (기본은 시간순으로 보여주는게 좋음)
    return timeline

SCENARIOS = [
    {
        "id": "practice",
        "title": "방과 후 자율 연습",
        "description": "조용한 체육관, 오직 배구공 튀기는 소리뿐. 캐릭터와 팀워크를 다지며 연습에 몰두합니다.",
        "goal": "특급 기술 습득하기",
        "system_instruction": "배경은 방과 후 자율 연습 중인 체육관입니다. 분위기는 열정적이고 집중력 있는 상태입니다."
    },
    {
        "id": "training_camp",
        "title": "도쿄 합숙 훈련 (바비큐 파티)",
        "description": "치열한 연습이 끝나고 찾아온 즐거운 저녁 식사 시간! 다른 학교 선수들과도 어울려보세요.",
        "goal": "다른 학교 캐릭터와 친해지기",
        "system_instruction": "배경은 도쿄 합숙 소의 저녁 바비큐 파티장입니다. 분위기는 시끌벅적하고 즐겁습니다. 캐릭터들이 평소보다 고기 앞에서 들뜬 상태입니다."
    },
    {
        "id": "match_verge",
        "title": "결승전 전야",
        "description": "내일은 드디어 전국 대회 예선 결승. 긴장감과 설레임이 교차하는 밤, 캐릭터와 속마음을 나눠보세요.",
        "goal": "캐릭터의 불안감 해소 및 격려",
        "system_instruction": "배경은 경기 전날 밤의 숙박 시설 또는 공원입니다. 긴장감이 흐르며 진지하고 감성적인 대화가 오갑니다."
    }
]

@app.get("/scenarios")
async def get_scenarios():
    return SCENARIOS

@app.post("/chat/{id}/observe")
async def observe_chat(id: str, request: ChatRequest):
    # 유저 메시지 없이 캐릭터들끼리 대화하도록 유도하는 시스템 메시지 추가
    system_instruction = "\n[SYSTEM: 유저는 현재 대화를 관찰 중입니다. 캐릭터들은 현재 상황과 서로의 성격에 기반하여 유저의 개입 없이 자연스럽게 대화를 이어가세요. 서로를 부르거나 도발하며 티격태격하는 생동감 넘치는 상호작용을 보여주세요. 절대 유저에게 직접 말을 걸지 마세요.]"
    
    modified_history = request.chat_history + [{"role": "system", "content": system_instruction}]
    
    # 기존 chat 엔드포인트 로직 재사용
    # (실제 대화 로직을 분리하지 않았으므로 직접 전달)
    return await chat(id, ChatRequest(
        message="[관찰 모드: 계속 대화해줘]", 
        chat_history=modified_history,
        user_profile_index=request.user_profile_index,
        char_ids=request.char_ids
    ))
