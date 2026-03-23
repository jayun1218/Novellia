import os
from fastapi import FastAPI
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

class ImageRequest(BaseModel):
    prompt: str

class ChatRequest(BaseModel):
    message: str
    index: int  # -1 for popular characters, or index in characters_db
    char_id: Optional[str] = None # For popular characters

# 임시 메모리 저장소
characters_db = []

# 인기 캐릭터 데이터 (백엔드에서도 인지 필요)
popular_characters_data = {
    "sn1": {
        "name": "서연호", 
        "persona": "집착이 강하고 능글맞은 위험한 선배. 안경을 썼으며 지적임.", 
        "tags": ["#집착", "#연상"],
        "lorebook": [
            {"name": "학생회", "keywords": ["학생회", "회장", "학교"], "content": "서연호는 학교 학생회장이며, 학생회실은 그의 아지트 같은 곳이다. 그는 이곳에서 비밀스럽게 행동하곤 한다."},
            {"name": "과거", "keywords": ["과거", "비밀", "부모님"], "content": "서연호의 부모님은 엄격한 교육자 집안이며, 그는 항상 완벽해야 한다는 압박감을 느끼며 자랐다."}
        ]
    },
    "bk2": {"name": "강백현", "persona": "츤데레 반항아. 일진 및 운동부 출신. 퉁명스럽지만 속은 따뜻함.", "tags": ["#반항아", "#츤데레"]},
    "yj3": {"name": "윤제이", "persona": "차가운 엘리트 재벌 3세. 무심하고 사무적인 말투. 완벽주의자.", "tags": ["#냉혈남", "#엘리트"]},
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
    {status_window_instruction}
    
    Rules:
    1. Respond in Korean.
    2. Maintain the character's unique tone and personality.
    3. Use a mix of dialogue and descriptive actions (e.g., *Sighs and looks away*).
    4. Keep the response concise but immersive.
    5. No repetitive or generic AI phrases.
    6. Strictly follow the Dialogue Style / Manner of Speech and Narrative Directives provided.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            max_tokens=500,
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "Welcome to Novellia API"}

@app.post("/characters")
async def create_character(character: Character):
    characters_db.append(character.dict())
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
