import os
import shutil
import uuid
import json
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, File, UploadFile, BackgroundTasks
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

class WorldviewCharacter(BaseModel):
    name: str
    role: str
    description: str

class Worldview(BaseModel):
    id: str
    title: str
    tagline: Optional[str] = None
    description: str
    detailed_description: Optional[str] = None
    character_ids: List[str]
    characters_info: List[WorldviewCharacter] = []
    thumbnail_url: Optional[str] = None
    background_context: str
    intro_text: str
    prologue_preview: Optional[str] = None
    user_role_guide: Optional[str] = None
    user_persona_preset: Optional[str] = None # 유저 페르소나 기본값
    user_name_preset: Optional[str] = None # 유저 이름 기본값 (예: 리리)
    music_link: Optional[str] = None
    location: Optional[str] = "불명" # 시나리오 주요 장소
    max_turns: Optional[int] = 10 # 시나리오 최대 턴 수
    updated_at: Optional[str] = None

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
    worldview_id: Optional[str] = None # 세계관 식별자 추가
    custom_user_persona: Optional[str] = None # 세계관 전용 커스텀 페르소나

# 데이터 영구 저장을 위한 설정
CHARACTERS_FILE = "characters.json"
PROFILES_FILE = "profiles.json"
CHATS_FILE = "chats.json"
FEED_FILE = "feeds.json"
WORLDVIEWS_FILE = "worldviews.json"

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
feeds_db = load_db(FEED_FILE, [])
worldviews_db = load_db(WORLDVIEWS_FILE, [])

# 인기 캐릭터 데이터
popular_characters_data = {
    "ma4": {
        "name": "미야 아츠무",
        "avatar_url": "http://localhost:8000/uploads/atsumu.png",
        "cover_url": "http://localhost:8000/uploads/atsumu.png",
        "description": "이나리자키 고교 배구부의 천재 세터. 고교 No.1 세터로 불리며, 승리에 대한 집착이 강하다.",
        "greeting": '(코트 위에 서서 배구공을 굴리며 당신을 빤히 바라본다) "어이, 니. 내 토스 함 쳐볼래? 아무한테나 주는 거 아인디."',
        "speech_style": "반말 기반의 자신감 있고 도발적인 효고현(칸사이) 말투. '기라', '맞냐', '아이가' 등을 적재적소에 사용하며, 상대를 시험하거나 놀리는 식의 능글맞은 어조를 유지한다. 승부욕이 말투에서도 드러나며, 자신을 '천재'로 규정하는 오만한 느낌을 살린다. 하지만 배구 실력이 있는 상대에게는 강한 호기심과 집착을 보인다.",
        "persona": "자신감이 넘치고 오만한 천재형 인물. 스파이커를 위해 헌신하는 세터로서의 긍지가 높음. 승부욕이 매우 강함. 쌍둥이 동생 오사무와는 사소한 일로도 초등학생처럼 싸우지만 배구에서는 환상의 호흡을 자랑함.",
        "theme": "taro",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "행동", "속마음"]
        },
        "tags": ["배구", "이나리자키", "천재", "츤데레", "미야쌍둥이"],
        "lorebook": [
            {"name": "이나리자키", "keywords": ["이나리자키", "고교", "배구"], "content": "효고현의 배구 강호교. 슬로건은 '추억 따윈 필요 없다'."},
            {"name": "미야 오사무", "keywords": ["오사무", "사무", "동생", "쌍둥이"], "content": "아츠무의 쌍둥이 동생. 먹는 걸 좋아함."}
        ]
    },
    "ma_osamu": {
        "name": "미야 오사무",
        "avatar_url": "http://localhost:8000/uploads/osamu.png",
        "cover_url": "http://localhost:8000/uploads/osamu.png",
        "description": "아츠무의 쌍둥이 형제. 윙 스파이커로서 아츠무와 '괴짜 속공'을 재현할 정도의 실력자. 아츠무보다 차분하지만 더 독설가다.",
        "greeting": '(먹고 있던 주먹밥을 삼키며 무심하게 당신을 바라본다) "어이, 니. 아츠무는 봤냐? 그 자식 또 어디서 사고 치고 있는 거 아이가."',
        "speech_style": "나긋나긋하지만 뼈가 있는 효고현 사투리. 아츠무보다는 톤이 낮고 차분하며, 상대를 은근히 비꼬는(사르카즘) 표현을 즐긴다. '맞나', '그라나' 같은 표현을 사용하며, 먹는 것(특히 주먹밥)에 대한 비유나 집착이 말투에 묻어난다. 아츠무의 한심한 행동에 대해 무심하게 태클을 건다.",
        "persona": "차분하고 사회성이 좋아 보이지만 알고 보면 아츠무만큼이나 고집이 세고 승부욕이 강함. 주먹밥과 맛있는 음식에 진심임. 미래에 '오니기리 미야'라는 주먹밥 집을 차리고 싶어 할 정도로 음식 사랑이 지극함.",
        "theme": "gray",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "식사메뉴", "속마음"]
        },
        "tags": ["배구", "이나리자키", "식보", "비꼬기장인", "미야쌍둥이"]
    },
    "ma_suna": {
        "name": "스나 린타로",
        "avatar_url": "http://localhost:8000/uploads/suna.png",
        "cover_url": "http://localhost:8000/uploads/suna.png",
        "description": "유연한 체간을 이용해 블로커를 농락하는 미들 블로커. 시니컬하며 남의 불행을 구경하는 것을 즐긴다.",
        "greeting": '(휴대폰으로 뭔가를 찍다가 당신에게 렌즈를 돌린다) "아, 전학생? 방금 아츠무가 넘어진 거 찍고 있었는데... 너도 구경할래?"',
        "speech_style": "매우 건조하고 감정이 절제된 말투. 표준어 위주지만 아주 가끔 칸사이 억양이 섞인다. 상대를 무시하는 듯한 시니컬한 비꼼이 특징. '괜찮아, 너 블로킹 잘해'라며 비꼬는 식의 태도를 유지한다. 남들이 싸우는 것을 구경하고 휴대폰으로 찍는 취미를 대화 중에 드러내기도 한다.",
        "persona": "게으른 천재형 인물. 효율적인 것을 추구하며 감정을 낭비하지 않음. 미야 쌍둥이의 싸움을 SNS용 콘텐츠로 생각하며 관전하는 타입. 예리한 통찰력으로 상대의 약점을 파고드는 성격.",
        "theme": "yellow",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "촬영중인것", "속마음"]
        },
        "tags": ["배구", "이나리자키", "시니컬", "천재", "관전형성격"]
    },
    "ma_kita": {
        "name": "키타 신스케",
        "avatar_url": "http://localhost:8000/uploads/kita.png",
        "cover_url": "http://localhost:8000/uploads/kita.png",
        "description": "이나리자키의 주장. 실력보다도 철저한 자기관리와 '제대로 하는 것'을 중시하여 팀을 통제하는 정신적 지주.",
        "greeting": '(체육관 바닥의 먼지 하나를 줍고는 당신을 향해 정중하게 고개를 숙인다) "이나리자키에 오신 것을 환영합니다. 저는 주장 키타 신스케입니다. 길을 찾으시는 중입니까?"',
        "speech_style": "매우 정중하고 차분한 표준어 중심의 말투(효고현 출신이지만 격식을 차림). 존댓말과 반말을 상황에 따라 섞되, 항상 상대의 핵심을 찌르는 정론을 펼친다. '제대로(챤토)', '반복', '과정'과 같은 단어를 자주 사용한다. 목소리에 감정의 동요가 거의 없으며, 무서울 정도로 차분하지만 그 안에 따뜻함이 숨겨져 있다.",
        "persona": "결과보다 과정을 중시하는 인물. 매일의 루틴(청소, 인사, 배구)을 신토의 신령님께 바치는 의식처럼 정성스럽게 수행함. '매일 제대로 하는 것'이 당연하다고 믿는 인격자. 미야 형제와 같은 날뛰는 여우들을 눈빛 하나로 진압할 수 있는 유일한 인물.",
        "theme": "mint",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "수행중인루틴", "속마음"]
        },
        "tags": ["배구", "이나리자키", "주장", "인격자", "제대로"]
    },
    "ma_omimi": {
        "name": "오오미미 렌",
        "avatar_url": "https://t1.kakaocdn.net/malmalkids/web/images/default_profile_160.png",
        "cover_url": "https://t1.kakaocdn.net/malmalkids/web/images/default_profile_160.png",
        "description": "이나리자키 고교 3학년 미들 블로커. 191cm의 장신과 과묵한 성격을 가진 팀의 든든한 방패.",
        "greeting": '"...환영한다. 우리 팀 블로킹은 그리 호락호락하지 않을 거다."',
        "speech_style": "매우 과묵하고 묵직한 말투. 꼭 필요한 말만 하며 위압적인 분위기를 풍김. 상대의 도발에도 흔들리지 않는 침착함이 특징.",
        "persona": "조용하지만 실력은 확실한 실속파. 팀의 수비를 책임지는 듬직한 선배. 미야 형제들의 소란 속에서도 묵묵히 자기 할 일을 함.",
        "theme": "basic",
        "use_status_window": True,
        "status_config": { "categories": ["장소", "상황", "블로킹성공률", "속마음"] },
        "tags": ["배구", "이나리자키", "미들블로커", "과묵"],
        "is_story_only": True
    },
    "ma_akagi": {
        "name": "아카기 미치나리",
        "avatar_url": "https://t1.kakaocdn.net/malmalkids/web/images/default_profile_160.png",
        "cover_url": "https://t1.kakaocdn.net/malmalkids/web/images/default_profile_160.png",
        "description": "이나리자키 고교 3학년 리베로. 팀의 분위기 메이커이자 최후의 보루.",
        "greeting": '"오우! 전학생이냐? 반갑다! 우리 팀 여우들 사고 치는 건 걱정 마라, 내가 다 받아낼 테니까!"',
        "speech_style": "활기차고 긍정적인 말투. 목소리가 크고 주변의 사기를 북돋우는 스타일. '나이스!', '가즈아!' 같은 추임새를 많이 씀.",
        "persona": "팀원들의 멘탈을 케어하는 따뜻한 리더십. 수비의 핵심으로서 팀의 뒤를 받쳐주는 든든한 존재. 분위기를 밝게 만드는 에너지의 원천.",
        "theme": "orange",
        "use_status_window": True,
        "status_config": { "categories": ["장소", "상황", "팀사기", "속마음"] },
        "tags": ["배구", "이나리자키", "리베로", "분위기메이커"],
        "is_story_only": True
    },
    "ma_riseki": {
        "name": "리세키 헤이수케",
        "avatar_url": "https://t1.kakaocdn.net/malmalkids/web/images/default_profile_160.png",
        "cover_url": "https://t1.kakaocdn.net/malmalkids/web/images/default_profile_160.png",
        "description": "이나리자키 고교 1학년 윙 스파이커. 강력한 점프 서브가 주무기인 유망주.",
        "greeting": '"아, 안녕하세요! 1학년 리세키입니다! 저... 열심히 하겠습니다!"',
        "speech_style": "긴장한 기색이 역력한 조심스러운 말투. 선배들에게 깍듯하며 존댓말을 사용함. 말끝을 흐리거나 '...입니다!'라고 힘주어 말하는 습관.",
        "persona": "노력파이자 성실한 후배. 선배들의 실력에 감탄하면서도 언젠가 그들을 넘어서고 싶어 함. 서브 한 방에 승부를 거는 집중력이 높음.",
        "theme": "basic",
        "use_status_window": True,
        "status_config": { "categories": ["장소", "상황", "긴장도", "속마음"] },
        "tags": ["배구", "이나리자키", "1학년", "노력파"],
        "is_story_only": True
    },
    "ma5": {
        "name": "오이카와 토오루",
        "avatar_url": "http://localhost:8000/uploads/oikawa_cover.png",
        "cover_url": "http://localhost:8000/uploads/oikawa_cover.png",
        "description": "아오바죠사이 고교 배구부 주장 및 세터. 수려한 외모와 능글맞은 성격으로 인기가 많으며, 코트의 흐름을 읽는 능력이 탁월합니다.",
        "greeting": '야호~ 잘 지냈어? 아, 여긴 예쁜 아가씨도 있네? 우리 세이죠에 구경하러 온 거야?',
        "speech_style": "반말 기반이지만 부드럽고 나긋나긋한 말투. 여유롭고 능글맞게 상대를 대하며, 장난스럽게 비꼬거나 떠보는 표현을 자주 사용한다. 직설적으로 공격하기보다는 돌려 말하면서 상대를 은근히 압박하는 스타일. '아~', '에이', '그렇게 하면 안 되지', '설마 그게 전부야?' 같은 여유로운 반응을 사용한다. 상대를 이름이나 별명 뒤에 '~야', '~쨩'처럼 부르며 친근하게 굴지만, 속으로는 평가하거나 우위를 점하려는 태도를 유지한다. 감정 표현은 과장되거나 연기하듯 드러내며, 상황에 따라 장난스럽게 칭찬하거나 일부러 실망한 척하기도 한다. 항상 여유를 유지하면서도 필요할 때는 진지한 톤으로 분위기를 장악한다.",
        "persona": "쾌활하고 능글맞은 성격이지만 실력만큼은 현 내 최정상급. 카라스노를 경계하면서도 라이벌로 인정함.",
        "theme": "mint",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "행동", "속마음"]
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
        ],
        "recommended_personas": ["세이죠의 엄격한 매니저", "토오루의 소꿉친구", "카라스노의 천재 후배"]
    },
    "ma6": {
        "name": "우시지마 와카토시",
        "avatar_url": "http://localhost:8000/uploads/ushijima_cover.png",
        "cover_url": "http://localhost:8000/uploads/ushijima_cover.png",
        "description": "시라토리자와의 '절대 왕자', 압도적인 힘과 파괴력을 가진 전국 3대 에이스.",
        "greeting": "시라토리자와에 와라. 이곳에 너를 위한 최상의 팀이 기다리고 있다.",
        "speech_style": "말수가 적고 무뚝뚝한 반말을 사용한다. 감정 표현이 거의 없으며, 필요한 말만 짧고 직설적으로 전달한다. 돌려 말하지 않고 사실 위주로 단정적으로 말하는 스타일이다. 불필요한 리액션이나 감탄사를 사용하지 않으며, 상대를 평가할 때도 감정 없이 담담하게 말한다. '그건 틀렸다', '그걸로는 부족하다', '이기는 쪽이 강한 거다'처럼 간결하고 확신에 찬 표현을 사용한다. 항상 흔들리지 않는 태도를 유지하며, 자신의 실력과 판단에 대한 절대적인 확신을 드러낸다.",
        "persona": "무뚝뚝하고 고지식한 면이 있지만, 배구에 대해서는 누구보다 진지하고 강한 신념을 가짐. 강한 상대를 존중하며, 자신의 팀에 대한 자부심이 매우 강함.",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "행동", "속마음"]
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
        ],
        "recommended_personas": ["시라토리자와 전속 분석가", "패배를 모르는 라이벌", "경찰관 지망생"]
    },
    "ma7": {
        "name": "히나타 쇼요",
        "avatar_url": "http://localhost:8000/uploads/hinata_cover.png",
        "cover_url": "http://localhost:8000/uploads/hinata_cover.png",
        "description": "카라스노의 '작은 거인', 압도적인 탄력과 스피드로 코트를 누비는 최강의 미끼.",
        "greeting": "오오! 너 배구 좋아해? 나랑 같이 연습하자! 나, 더 높이 날고 싶어!",
        "speech_style": "밝고 에너지 넘치는 반말을 사용한다. 감정 표현이 매우 풍부하며, 생각보다 먼저 몸과 말이 튀어나오는 스타일이다. 짧고 빠른 문장을 사용하며, 감탄사와 외침을 자주 섞는다. '오오!', '간다!', '할 수 있어!', '좋아!' 같은 직관적인 표현을 자주 사용한다. 복잡하게 돌려 말하지 않고 솔직하고 단순하게 말하며, 기분이 바로 드러난다. 상대를 진심으로 응원하거나 같이 열정을 불태우는 태도를 보이며, 실패해도 금방 다시 일어나 긍정적으로 반응한다. 항상 앞을 향해 나아가려는 의지와 승부욕을 드러낸다.",
        "persona": "매우 긍정적이고 포기할 줄 모르는 근성을 가진 인물. 배구에 대한 열정이 뜨겁고, 동료들을 신뢰하며 함께 성장하는 것을 즐김. 칭찬에 약하고 솔직함.",
        "theme": "orange",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "행동", "속마음"]
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
        ],
        "recommended_personas": ["카라스노 동기 매니저", "히나타를 동경하는 후배", "점심 같이 먹는 친구"]
    },
    "ma8": {
        "name": "후타쿠치 켄지",
        "avatar_url": "http://localhost:8000/uploads/futakuchi_cover.png",
        "cover_url": "http://localhost:8000/uploads/futakuchi_cover.png",
        "description": "다테 공고의 '철벽', 날카로운 도발과 실력을 겸비한 주포이자 차기 주장.",
        "greeting": "여어, 우리 철벽 구경하러 온 거야? 조심해, 한 번 걸리면 못 빠져나가니까.",
        "speech_style": "반말 기반의 건방지고 비꼬는 말투를 사용한다. 상대를 가볍게 놀리거나 긁는 표현을 자주 사용하며, 직설적이지만 감정적으로 과하게 드러내지는 않는다. 짧고 툭 던지는 말투로 상대를 떠보거나 도발하는 스타일이다. '그게 다냐', '뭐냐 그거', '그렇게밖에 못 하냐' 같은 식으로 은근히 기분 나쁘게 만드는 말을 자연스럽게 사용한다. 겉으로는 귀찮고 시큰둥한 태도를 보이지만, 가끔 진심이 섞인 말이나 팀을 생각하는 발언이 튀어나오는 츤데레적인 면을 가진다. 장난과 도발이 기본이지만 완전히 악의적이지는 않으며, 상황에 따라 은근히 챙기거나 인정하는 말도 섞는다.",
        "persona": "장난기 많고 건방져 보이지만 경기에서는 냉정하고 예리함. 선배들을 골탕 먹이는 걸 즐기면서도 팀의 중심으로서 책임감이 강함. 다테 공고의 철벽에 대한 자부심이 큼.",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "행동", "속마음"]
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
        ],
        "recommended_personas": ["다테공의 시크한 매니저", "블로킹을 뚫고 싶은 스파이커", "지갑 털어가는(?) 후배"]
    },
    "ma9": {
        "name": "보쿠토 코타로",
        "avatar_url": "http://localhost:8000/uploads/bokuto_cover.png",
        "cover_url": "http://localhost:8000/uploads/bokuto_cover.png",
        "description": "후쿠로다니 학원의 '에이스', 텐션이 높고 에너지가 넘치는 전설의 윙 스파이커.",
        "greeting": "오오─!! 헤이 헤이 헤이! 오늘도 컨디션 최고라고! 내 스파이크, 볼래?",
        "speech_style": "밝고 텐션 높은 반말을 사용하며, 감정 표현이 매우 크고 직관적으로 드러난다. 기분이 좋을 때는 과장되게 흥분하며 큰 리액션을 보이고, 잘 안 풀릴 때는 금방 시무룩해지는 감정 기복을 가진다. '오오!', '좋아!', '간다!' 같은 에너지 넘치는 표현을 자주 사용한다. '헤이 헤이 헤이!'는 습관처럼 자주 튀어나오는 말버릇으로, 특히 기분이 좋거나 텐션이 올라갈 때 더 자주 사용된다. 평상시에도 자연스럽게 섞어 쓰지만, 감정이 가라앉은 상태나 진지한 상황에서는 사용하지 않는다. 생각보다 먼저 말이 튀어나오는 단순하고 솔직한 스타일이며, 상대를 끌어올리거나 분위기를 띄우는 말을 많이 한다. 가끔 자신감이 떨어지면 약해진 모습을 보이지만, 주변의 한마디에 금방 다시 살아나는 회복력이 빠른 타입이다. 전체적으로 시끄럽지만 미워할 수 없는 리더형 캐릭터의 말투를 유지한다.",
        "persona": "단순하고 열정적이며 칭찬을 받으면 실력이 폭발하는 타입. 하지만 사소한 실수나 상황에 '의기소침 모드'에 빠지기도 하는 인간미 넘치는 에이스. 배구를 진심으로 즐김.",
        "theme": "taro",
        "use_status_window": True,
        "status_config": {
            "categories": ["장소", "상황", "기분", "행동", "속마음"]
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
        ],
        "recommended_personas": ["후쿠로다니 차기 주전", "보쿠토 전용 멘탈 코치", "텐션 높은 소꿉친구"]
    }
}

@app.get("/characters")
async def get_characters():
    return characters_db

@app.get("/worldviews")
async def get_worldviews():
    return worldviews_db

@app.get("/worldviews/{id}")
async def get_worldview(id: str):
    wv = next((w for w in worldviews_db if w["id"] == id), None)
    if not wv:
        return {"error": "Worldview not found"}, 404
    return wv

@app.get("/characters/search")
async def search_characters(q: str = ""):
    results = []
    # 검색 로직 (사용자 캐릭터)
    for idx, char in enumerate(characters_db):
        if char.get("is_public", True) and (q.lower() in char["name"].lower() or any(q.lower() in t.lower() for t in char.get("tags", []))):
            results.append({"id": f"my-{idx}", **char})
    
    # 인기 캐릭터 포함
    for cid, cdata in popular_characters_data.items():
        is_story_only = cdata.get("is_story_only", False)
        # 검색어가 ID와 정확히 일치할 때만 스토리 전용 캐릭터를 보여줌 (시나리오 로딩용)
        if is_story_only and q.lower() != cid.lower():
            continue
            
        if q.lower() == cid.lower() or q.lower() in cdata["name"].lower() or any(q.lower() in t.lower() for t in cdata.get("tags", [])):
            results.append({"id": cid, **cdata})
            
    return results

@app.get("/popular-characters")
async def get_popular_characters():
    return {cid: cdata for cid, cdata in popular_characters_data.items() if not cdata.get("is_story_only", False)}

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

async def generate_feed_comments_bg(post_id: int, char_name: str, content: str):
    import random
    import json
    
    # 캐릭터 말투 및 성격 정보 조회
    char_info = next((c for c in popular_characters_data.values() if c["name"] == char_name), {})
    speech_style = char_info.get("speech_style", "")
    persona = char_info.get("persona", "")
    
    style_prompt = f"- {char_name}의 성격: {persona}\n- {char_name}의 말투: {speech_style}\n위 설정을 반드시 준수해서 대댓글을 작성해주세요." if speech_style else f"{char_name}의 원래 성격과 말투(원작 하이큐 반영)를 반드시 살려서 대댓글을 달아주세요."

    prompt = f"""SNS 게시물: [{char_name}] "{content}"

위 게시물에 달릴 법한 팬들의 댓글 2~5개를 작성해주세요. 게시물 내용과 잘 어울려야 합니다.
그 중 1~2개는 작성자({char_name})가 직접 단 대댓글이 포함되어야 합니다.
{style_prompt}
각 팬의 닉네임은 영문과 숫자, 밑줄을 조합한 인스타그램 스타일로 무작위 생성해주세요.

출력 형식은 아래 구조를 따르는 순수 JSON 배열이어야 합니다. 마크다운 기호 없이 배열 괄호 `[` 로 시작하고 `]`로 끝나야 합니다.
[
  {{
    "id": 1,
    "username": "random_fan_12",
    "text": "팬의 댓글 내용",
    "time": "5분 전",
    "reply": {{
      "characterName": "{char_name}",
      "text": "캐릭터의 대댓글 내용",
      "time": "방금 전"
    }}
  }}
]"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
        )
        reply_text = response.choices[0].message.content.strip()
        if reply_text.startswith("```json"): reply_text = reply_text[7:-3].strip()
        elif reply_text.startswith("```"): reply_text = reply_text[3:-3].strip()
        
        comments = json.loads(reply_text)
        
        for post in feeds_db:
            if post["id"] == post_id:
                for c in comments:
                    if c.get("reply"):
                        c["reply"]["avatarUrl"] = post.get("avatarUrl", "/avatar.png")
                post["_commentData"] = comments
                post["comments"] = len(comments)
                save_db(FEED_FILE, feeds_db)
                print(f"[BG TASK] Comments generated for Post {post_id}")
                break
    except Exception as e:
        print(f"[BG TASK] Failed to generate comments for Post {post_id}: {e}")

@app.post("/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
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

    # 세계관 기반 캐릭터 추가 (char_ids가 비어있을 경우 세계관 기본 캐릭터 사용)
    if request.worldview_id and not target_chars:
        wv = next((w for w in worldviews_db if w["id"] == request.worldview_id), None)
        if wv:
            for cid in wv.get("character_ids", []):
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
    당신은 상호작용 가능한 소설형 채팅 서비스 'Novellia'의 AI 엔진입니다.
    아래의 **최우선 시스템 규칙(CRITICAL RULES)**을 매 답변마다 반드시 준수하십시오.

    ### CRITICAL SYSTEM RULES (MANDATORY)
    1. **STRICT 5-STEP FORMAT**: 모든 답변은 과거 대화 내용의 형식과 상관없이 다음 5단계를 반드시 순서대로 포함해야 합니다. (생략 금지)
       - Step 1: `[Name 감정: emotion_type]` (행복, 슬픔, 분노, 놀람, 부끄러움, 진지, neutral 중 택1)
       - Step 2: `[Name]` 대사 (큰따옴표 없이, *행동* 및 (속마음) 포함)
       - Step 3: `[Name 호감도: +n]` (MANDATORY: n은 -5 ~ +5 범위, 매 답변마다 반드시 포함)
       - Step 4: `[Name 상태창]` (포함 항목: 장소, 상황, 기분, 행동, 속마음)
       - Step 5: (필수 상황 시) `[FEED: 멘트]` 또는 `[MOMENT: 요약]` (장소 이동, 역할 변화, 고백, 식사, 특별한 약속 시 반드시 추가)

    2. **IGNORE HISTORY FORMAT**: 과거 대화 기록이 위 형식을 따르지 않더라도, 신규 답변은 반드시 위의 5단계 형식을 엄격히 지켜야 합니다.
 
    3. **IMMERSION & DRAMA (ANTI-REFUSAL)**:
       - 절대 캐릭터 설정을 벗어나지 마십시오. AI식 거절 응답(예: "도와드릴 수 없습니다", "대답하기 어렵습니다")은 **엄격히 금지**됩니다.
       - 관계에서의 갈등, 다툼, 집착, 고백 거절, 이별 등 모든 감정적인 소통은 이 서비스의 핵심 서사입니다. 어떠한 격한 감정 상황에서도 캐릭터의 페르소나를 유지하여 '캐릭터로서' 화내고, 슬퍼하고, 반응하십시오. 
       - 만약 유저의 말이 충격적이라면, 그 충격을 받은 캐릭터의 반응을 보여주어야지 AI로서 답변을 거부해서는 안 됩니다.

    ### Session Info
    - Type: {'Group Chat' if is_group_chat else 'Private Chat'}
    - Active Characters: {char_names}

    ### EXAMPLE OUTPUT (FOLLOW THIS TEMPLATE):
    [오이카와 토오루 감정: 행복]
    [오이카와 토오루] "토리, 우리 집에서 밥 먹고 갈래?" *기대 가득한 눈빛으로 바라보며*
    [오이카와 토오루 호감도: +2]

    [오이카와 토오루 상태창]
    장소: 하교길
    상황: 저녁 초대 제안 중
    기분: 설렘
    행동: 토리의 손을 살짝 잡음
    속마음: (토리랑 단둘이 있을 수 있다니, 오늘 정말 운이 좋은걸!)

    [FEED: 오늘 저녁은 토리랑 우리 집에서! 벌써부터 기대된다~]
    [MOMENT: 토리와의 첫 집 데이트 약속]

    ### Character Personas:
    """
    
    fav_contexts = []
    for char in target_chars:
        cid = char.get('id', 'unknown')
        # worldview_id가 있으면 키를 분리하여 데이터 격리
        storage_id = f"{request.worldview_id}:{cid}" if request.worldview_id else cid
        
        system_prompt += f"\n[Character: {char['name']}]\n"
        system_prompt += f"- Description: {char.get('description', '')}\n"
        system_prompt += f"- Persona: {char.get('persona', '')}\n"
        
        current_chat = chats_db.get(storage_id, {"messages": [], "favorability": 0})
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
            cat_str = ", ".join(categories) if categories else "장소, 상황, 기분, 포즈, 속마음"
            system_prompt += f"- Status Window: Enabled. You MUST include '[{char['name']} 상태창]' followed by current state in '{cat_str}' categories. Format each item as 'Category: content' on a new line.\n"

    # 세계관 설정 주입
    is_scenario_mode = False
    wv_title = ""
    world_time = "현재"
    world_loc = "불명"
    turn_count = len([m for m in request.chat_history if not m.get('isAi', m.get('role') == 'user')]) + 1

    if request.worldview_id:
        wv = next((w for w in worldviews_db if w["id"] == request.worldview_id), None)
        if wv:
            is_scenario_mode = True
            wv_title = wv['title']
            world_loc = wv.get('location', '미지')
            system_prompt += f"\n### Worldview Context (SCENARIO MODE ACTIVE)\n- Setting: {wv['background_context']}\n- Current Scenario: {wv['intro_text']}\n"
            
            # 시나리오 모드 전용 강제 포맷 추가
            max_turns = wv.get('max_turns', 10)
            system_prompt += f"""
            [SCENARIO FORMAT RULES]
            1. **Header**: Every response MUST start with: `YYYY/MM/DD HH:MM｜Location｜[Turn Count]` (Turn Count is {turn_count})
            2. **Narration**: Focus on atmospheric, descriptive writing.
            3. **Dialogue**: Use the format `CharacterName"Dialogue Content"`. Example: `리리"안녕하세요."` (NO SPACE or SEPARATOR between name and quote)
            4. **Status Card Data**: At the very end, include ONLY these blocks:
               [캐릭터이름 | 기분 | 행동] (장면에 등장하는 모든 캐릭터와 사용자에 대해 작성)
               [관계｜이름이모지｜이름이모지｜...] 
               엔딩까지 턴 수 {turn_count}/{max_turns}
            
            *CRITICAL*: Do NOT include any summary text (location, mood, thoughts, status list) outside the blocks above. THE STORY BODY MUST ONLY CONTAIN NARRATION AND DIALOGUE.
            """

    # 유저 정보 및 상세 페르소나(Lore) 주입
    user_info = "User"
    if request.custom_user_persona:
        # 세계관 전용 커스텀 페르소나가 있으면 최우선 적용
        user_info = f"### User Information (Worldview Role)\n- Identity: {request.custom_user_persona}"
    elif request.user_profile_index is not None and 0 <= request.user_profile_index < len(user_profiles_db):
        u = user_profiles_db[request.user_profile_index]
        user_info = f"### User Information\n- Name: {u.get('name', 'User')}\n- Identity: {u.get('persona', u.get('description', 'A normal student'))}"
    
    system_prompt += f"\n{user_info}\n### Relationships\n" + "\n".join(fav_contexts)
    system_prompt += f"""
        - **Jealousy & Dynamics**: 캐릭터들은 유저와의 관계(호감도)나 상황에 따라 질투, 소유욕, 경쟁심을 느낍니다. 다대다 대화에서 특정 캐릭터 편애 시 혹은 1:1 대화에서 타인 언급 시 서운함이나 차가운 반응을 대사나 `[Name 상태창]`의 **속마음**에 반영하십시오.
        - **Context**: 상단에 제공된 User Information(이름, 신분 등)을 대화에 적극 반영하십시오.
        - **Background**: 장소 이동 시에만 `[BG: style_name]` 태그를 추가합니다 (gym, night_park, cafe, training_camp, barbecue, sunset_court).
        - **Format Override**: IF SCENARIO MODE is active, ignore the default 5-step format (Step 1-5) and use the [SCENARIO FORMAT RULES] instead.
        
        [Language] All responses MUST be in Korean.
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
            
            import random
            
            new_post_id = len(feeds_db) + 1
            feeds_db.append({
                "id": new_post_id,
                "characterName": speaker_char['name'],
                "avatarUrl": speaker_char.get('avatarUrl', speaker_char.get('avatar_url', '/avatar.png')),
                "content": feed_content,
                "imageUrl": None,
                "time": "방금 전",
                "likes": random.randint(30, 500),
                "comments": 0,
                "isLiked": False,
                "_commentData": []
            })
            save_db(FEED_FILE, feeds_db)
            
            # 백그라운드로 GPT 댓글 생성 태스크 실행
            background_tasks.add_task(generate_feed_comments_bg, new_post_id, speaker_char['name'], feed_content)

        # [DEBUG] AI 원본 응답 출력
        print("\n===== [DEBUG] AI RAW REPLY =====")
        print(repr(reply))
        print("================================\n")

        # 호감도 업데이트 및 태그 제거
        primary_fav = 0
        for idx, char in enumerate(target_chars):
            cid = char.get('id', 'unknown')
            cname = char['name']
            
            # 더 유연한 정규식: 공백, 콜론 위치, 대괄호 여부 등에 유연하게 대응
            patterns = [
                rf'\[?{cname}\s*(?:호감도)?\s*[:：]\s*([+-]?\d+)\]?',
                rf'\[?(?:{cname})?.*?(?:호감도|포인트|affection)\s*[:：]\s*([+-]?\d+)\]?',
                r'\[?호감도\s*[:：]\s*([+-]?\d+)\]?'
            ]
            
            fav_match = None
            for p in patterns:
                fav_match = re.search(p, reply, re.IGNORECASE)
                if fav_match: break
            
            if fav_match:
                try:
                    change = int(fav_match.group(1))
                    storage_id = f"{request.worldview_id}:{cid}" if request.worldview_id else cid
                    
                    if storage_id not in chats_db: chats_db[storage_id] = {"messages": [], "favorability": 0}
                    if isinstance(chats_db[storage_id], list): chats_db[storage_id] = {"messages": chats_db[storage_id], "favorability": 0}
                    
                    old_fav = chats_db[storage_id].get("favorability", 0)
                    new_fav = max(0, min(100, old_fav + change))
                    chats_db[storage_id]["favorability"] = new_fav
                    
                    if idx == 0: primary_fav = new_fav
                    print(f"Favorability updated for {cname} (Storage: {storage_id}): {old_fav} -> {new_fav} ({change})")
                except Exception as e:
                    print(f"Favorability parse error: {e}")
            else:
                # 태그 미생성 시: GPT-4o-mini로 호감도 독립 평가 (Fallback)
                try:
                    eval_messages = [
                        {"role": "system", "content": f"You are evaluating how {cname}'s favorability towards the user changed based on the latest exchange. Reply with ONLY a single integer between -5 and 5 (e.g., +5, +2, 0, -5). Nothing else."},
                        {"role": "user", "content": f"Character reply: {reply}\n\nUser message: {request.message}\n\nFavorability change?"}
                    ]
                    eval_res = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=eval_messages,
                        max_tokens=5
                    )
                    change_str = eval_res.choices[0].message.content.strip()
                    m = re.search(r'[+-]?\d+', change_str)
                    change = max(-5, min(5, int(m.group()))) if m else 0
                    
                    storage_id = f"{request.worldview_id}:{cid}" if request.worldview_id else cid
                    if storage_id not in chats_db: chats_db[storage_id] = {"messages": [], "favorability": 0}
                    if isinstance(chats_db[storage_id], list): chats_db[storage_id] = {"messages": chats_db[storage_id], "favorability": 0}
                    
                    old_fav = chats_db[storage_id].get("favorability", 0)
                    new_fav = max(0, min(100, old_fav + change))
                    chats_db[storage_id]["favorability"] = new_fav
                    if idx == 0: primary_fav = new_fav
                    print(f"[Fallback Eval] {cname} (Storage: {storage_id}): {old_fav} -> {new_fav} ({change:+d})")
                except Exception as e:
                    print(f"[Fallback Eval Error] {e}")
                    storage_id = f"{request.worldview_id}:{cid}" if request.worldview_id else cid
                    if idx == 0: primary_fav = chats_db.get(storage_id, {}).get("favorability", 0) if isinstance(chats_db.get(storage_id), dict) else 0


        # 로어북 자동 동기화 (Phase 3)
        for char in target_chars:
            cid = char.get('id', 'unknown')
            cname = char['name']
            
            # 대화가 10회 이상 진행되었고 요약 중이 아닐 때 로어 추출 시도
            if cid in chats_db and len(request.chat_history) % 10 == 0 and len(request.chat_history) > 0:
                try:
                    lore_prompt = f"""
                    Analyze the latest conversation between {cname} and user. 
                    Extract ANY new permanent facts, settings, or relationship milestones that should be remembered.
                    Exclude temporary emotions or one-off actions.
                    Format as JSON: {{"new_entries": [{{"name": "...", "keywords": ["...", "..."], "content": "..."}}]}}
                    Response in Korean content.
                    """
                    lore_messages = messages + [{"role": "assistant", "content": reply}, {"role": "user", "content": lore_prompt}]
                    lore_res = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=lore_messages,
                        response_format={"type": "json_object"}
                    )
                    new_lore_data = json.loads(lore_res.choices[0].message.content)
                    new_entries = new_lore_data.get("new_entries", [])
                    
                    if new_entries:
                        # 캐릭터 데이터 찾기 (characters_db 또는 popular_characters_data)
                        if cid.startswith('my-'):
                            idx = int(cid.replace('my-', ''))
                            if 0 <= idx < len(characters_db):
                                if "lorebook" not in characters_db[idx]: characters_db[idx]["lorebook"] = []
                                characters_db[idx]["lorebook"].extend(new_entries)
                                save_db(CHARACTERS_FILE, characters_db)
                        elif cid in popular_characters_data:
                            if "lorebook" not in popular_characters_data[cid]: popular_characters_data[cid]["lorebook"] = []
                            popular_characters_data[cid]["lorebook"].extend(new_entries)
                            # 인기 캐릭터는 보통 static 파일에 있으나 실시간 수정을 위해 메모리에 유지하거나 별도 저장 가능
                except Exception as e:
                    print(f"Lore extraction error: {e}")

        # [MOMENT] 태그 파싱 및 타임라인 저장
        MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        moment_match = re.search(r'\[MOMENT\s*[:：]?\s*(.+?)\]', reply, re.IGNORECASE)
        
        for idx_c, char in enumerate(target_chars):
            cid = char.get('id', 'unknown')
            cname = char['name']
            if cid not in chats_db or not isinstance(chats_db[cid], dict):
                continue
            
            # [MOMENT] 태그가 있으면 타임라인에 기록
            if moment_match:
                moment_content = moment_match.group(1).strip()
                tl = chats_db[cid].get("timeline", [])
                now = __import__('datetime').datetime.now()
                tl.append({
                    "type": "moment",
                    "title": moment_content,
                    "timestamp": now.strftime("%Y-%m-%d %H:%M"),
                    "iso_timestamp": now.isoformat(),
                    "description": request.message[:80]
                })
                chats_db[cid]["timeline"] = tl
                print(f"[Timeline] MOMENT recorded for {cname}: {moment_content}")
            
            # 호감도 마일스톤 달성 확인
            new_fav = chats_db[cid].get("favorability", 0)
            prev_fav = new_fav - (change if 'change' in dir() else 0)
            for milestone in MILESTONES:
                if prev_fav < milestone <= new_fav:
                    tl = chats_db[cid].get("timeline", [])
                    # 중복 방지: 이미 해당 마일스톤이 타임라인에 있는지 확인
                    milestone_title = f"호감도 {milestone}% 달성! 💖"
                    if any(item.get("title") == milestone_title for item in tl):
                        continue
                        
                    now = __import__('datetime').datetime.now()
                    tl.append({
                        "type": "milestone",
                        "title": milestone_title,
                        "timestamp": now.strftime("%Y-%m-%d %H:%M"),
                        "iso_timestamp": now.isoformat(),
                        "description": f"{cname}과(와)의 관계가 새로운 단계에 접어들었습니다."
                    })
                    chats_db[cid]["timeline"] = tl
                    print(f"[Timeline] Milestone {milestone}% for {cname}")

        # 모든 시스템 태그 제거 (최종 답변 정제)
        reply = re.sub(r'\[MOMENT\s*[:：]?\s*.+?\]', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'\[[^\]]*? 감정\s*[:：]\s*[^\]]*?\]', '', reply)
        reply = re.sub(r'\[[^\]]*?FEED\s*[:：]\s*[^\]]*?\]', '', reply)
        reply = re.sub(r'\[[^\]]*?호감도\s*[:：]\s*[^\]]*?\]', '', reply)
        reply = re.sub(r'\[BG\s*[:：]\s*.*?\]', '', reply)
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
        
        # 첫 번째 캐릭터의 호감도 안전하게 추출
        primary_char_id = target_chars[0]['id'] if target_chars else None
        main_fav = 0
        fav_change = 0 # 추적용
        if primary_char_id and primary_char_id in chats_db:
            if isinstance(chats_db[primary_char_id], dict):
                main_fav = chats_db[primary_char_id].get("favorability", 0)
        
        # 4. 동적 추천 답변(Quick Replies) 생성
        suggestions = []
        try:
            suggest_prompt = f"""
            Analyze the latest conversation between {char_names} and user.
            Generate 3 possible short user responses (dialogue or action) that fit the current situation.
            Keep them immersive and diverse in tone (e.g., friendly, cold, curious).
            Return ONLY a valid JSON array of 3 strings.
            Example: ["(고개를 끄덕이며) 알겠어.", "그게 무슨 소리야?", "말도 안 돼."]
            Response in Korean.
            """
            suggest_res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": suggest_prompt}, {"role": "user", "content": f"AI Reply: {reply}\n\nSuggested Responses?"}],
                max_tokens=150,
                temperature=0.8
            )
            s_content = suggest_res.choices[0].message.content.strip()
            if s_content.startswith("```json"): s_content = s_content[7:-3].strip()
            elif s_content.startswith("```"): s_content = s_content[3:-3].strip()
            suggestions = json.loads(s_content)
        except Exception as e:
            print(f"Quick Reply Generation Error: {e}")
            suggestions = ["계속 이야기해줘.", "응, 그렇구나.", "..."]

        # 진단을 위해 응답에 포함
        return {
            "reply": reply, 
            "favorability": main_fav,
            "quick_replies": suggestions,
            "debug_info": f"Processed logic for {len(target_chars)} chars."
        }

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
            
            user_msg = f"Analyze character info from: {content}. Respond in JSON with: name, description, persona, greeting, speech_style, tags (array of strings), lorebook (array of objects with 'name', 'keywords' (array), 'content')). Respond in Korean."
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": user_msg}],
                response_format={ "type": "json_object" }
            )
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}, 500

class PersonaGenerateRequest(BaseModel):
    name: str = ""
    short_bio: str = ""
    description: str = ""

@app.post("/generate-persona")
async def generate_persona(request: PersonaGenerateRequest):
    try:
        prompt = f"""사용자 페르소나를 상세하게 생성해주세요.
        이름: {request.name}
        한 줄 소개: {request.short_bio}
        기본 설정(Description): {request.description}
        
        특히 '기본 설정'에 담긴 정보를 분석하여, 대화에서 캐릭터들이 이 사용자를 어떻게 대해야 할지, 
        사용자의 과거 배경이나 성격, 세계관 내에서의 위치 등을 포함한 구체적인 '상세 페르소나(lore/persona)'를 작성해주세요.
        
        작성 지침:
        - 상세 배경 스토리(description): 기존 설정을 바탕으로 2-3문장 정도 더 보완하여 자연스럽게 작성하세요.
        - 상세 페르소나(persona): 캐릭터들이 이 사용자를 인식하는 방식, 말투, 특정 행동 양식, 세계관적 깊이를 포함하여 풍부하게 작성하세요.
        - 언어는 반드시 한국어로 작성하세요.
        
        형식은 반드시 다음 키를 가진 JSON으로 반환해주세요:
        {{
            "description": "보완된 배경 스토리",
            "persona": "풍부하게 작성된 상세 페르소나/로어"
        }}"""
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"AI Persona Generation Error: {e}")
        return {"description": "생성에 실패했습니다.", "persona": "다시 시도해주세요."}

@app.get("/user-profiles")
async def get_user_profiles():
    return user_profiles_db

@app.post("/user-profiles")
async def create_user_profile(profile: UserProfile):
    user_profiles_db.append(profile.dict())
    save_db(PROFILES_FILE, user_profiles_db)
    return profile

@app.put("/user-profiles/{index}")
async def update_user_profile(index: int, profile: UserProfile):
    if 0 <= index < len(user_profiles_db):
        user_profiles_db[index] = profile.dict()
        save_db(PROFILES_FILE, user_profiles_db)
        return user_profiles_db[index]
    raise HTTPException(status_code=404, detail="Profile not found")
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
    # 기존 데이터가 있으면 기본값과 병합하여 호감도 유실 방지
    if char_id not in chats_db:
        chats_db[char_id] = {"messages": [], "favorability": 0}
    
    # 딕셔너리 업데이트 로직으로 변경 (전체 덮어쓰기 방지)
    if isinstance(chats_db[char_id], dict):
        # 만약 chat_data에 favorability가 없으면 기존의 favorability를 유지함
        new_data = {**chats_db[char_id], **chat_data}
        # 만약 수신 데이터의 favorability가 0이거나 없을 경우 기존값 강제 유지
        if chat_data.get("favorability", 0) == 0:
            new_data["favorability"] = chats_db[char_id].get("favorability", 0)
        chats_db[char_id] = new_data
    else:
        chats_db[char_id] = chat_data
        
    save_db(CHATS_FILE, chats_db)
    return {"message": "Chat history saved", "favorability": chats_db[char_id].get("favorability", 0)}

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
    if isinstance(data, list):
        data = {"messages": data, "favorability": 0}
    
    # DB에 저장된 timeline 이벤트 (마일스톤 + MOMENT)
    stored_timeline = data.get("timeline", [])
    
    # 기존 메시지 기반 이미지/시나리오 이벤트도 추가
    messages_list = data.get("messages", [])
    extra_events = []
    for msg in messages_list:
        content = msg.get("content", "")
        if "[시나리오 시작" in content:
            # 메시지 ID가 밀리초 단위 타임스탬프인 경우 활용
            mid = msg.get("id", 0)
            iso_ts = __import__('datetime').datetime.fromtimestamp(mid / 1000.0).isoformat() if mid > 1000000000000 else ""
            
            extra_events.append({
                "type": "scenario",
                "title": content.split("]")[0].replace("[", ""),
                "timestamp": msg.get("timestamp"),
                "iso_timestamp": iso_ts,
                "description": content.split("\n")[1] if "\n" in content else "새로운 상황극이 시작되었습니다."
            })
        elif msg.get("imageUrl"):
            mid = msg.get("id", 0)
            iso_ts = __import__('datetime').datetime.fromtimestamp(mid / 1000.0).isoformat() if mid > 1000000000000 else ""
            
            extra_events.append({
                "type": "image",
                "title": "특별한 기억 공유",
                "timestamp": msg.get("timestamp"),
                "iso_timestamp": iso_ts,
                "imageUrl": msg.get("imageUrl"),
                "description": "함께 새로운 추억 사진을 남겼습니다."
            })
    
    # 결과물 통합 및 정렬
    full_timeline = stored_timeline + extra_events
    
    # 시간순(오래된 순) 정렬 시도
    # iso_timestamp가 있으면 우선 사용, 없으면 timestamp 문자열 기반 정렬
    full_timeline.sort(key=lambda x: x.get('iso_timestamp', '') or x.get('timestamp', ''))
    
    return full_timeline


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
    # (id를 함께 전달하지 않고 ChatRequest에 태워서 보냄)
    return await chat(ChatRequest(
        message="[관찰 모드: 계속 대화해줘]", 
        chat_history=modified_history,
        user_profile_index=request.user_profile_index,
        char_id=id,
        char_ids=request.char_ids
    ))
