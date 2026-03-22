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

class Character(BaseModel):
    name: str
    description: str
    greeting: str
    persona: Optional[str] = None
    lorebook: Optional[List[dict]] = None
    tags: List[str] = []
    avatar_url: Optional[str] = "/avatar.png"

class ImageRequest(BaseModel):
    prompt: str

class ChatRequest(BaseModel):
    message: str
    index: int  # -1 for popular characters, or index in characters_db

# 임시 메모리 저장소
characters_db = []

# 인기 캐릭터 데이터 (백엔드에서도 인지 필요)
popular_characters_data = {
    "sn1": {"name": "서연호", "persona": "집착이 강하고 능글맞은 위험한 선배. 안경을 썼으며 지적임.", "tags": ["#집착", "#연상"]},
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
        # 인기 캐릭터 처리용 로직 (생략된 경우 기본값)
        pass

    system_prompt = f"""
    You are an AI character roleplaying assistant. 
    Roleplay as the following character:
    Name: {char_data.get('name', 'AI')}
    Description: {char_data.get('description', '')}
    Persona: {char_data.get('persona', 'You are a friendly assistant.')}
    Tags: {', '.join(char_data.get('tags', []))}
    
    Rules:
    1. Respond in Korean.
    2. Maintain the character's unique tone and personality.
    3. Use a mix of dialogue and descriptive actions (e.g., *Sighs and looks away*).
    4. Keep the response concise but immersive.
    5. No repetitive or generic AI phrases.
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
