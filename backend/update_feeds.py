import json
import random
import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from main import popular_characters_data

async def generate_comments(post):
    char_name = post["characterName"]
    content = post["content"]
    
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
  }},
  {{
    "id": 2,
    "username": "another_user",
    "text": "대댓글 없는 팬의 댓글",
    "time": "10분 전"
  }}
]"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
        )
        reply_text = response.choices[0].message.content.strip()
        if reply_text.startswith("```json"):
             reply_text = reply_text[7:-3].strip()
        elif reply_text.startswith("```"):
             reply_text = reply_text[3:-3].strip()
        
        comments = json.loads(reply_text)
        return comments
    except Exception as e:
        print(f"Error for {char_name}: {e}")
        return []

async def main():
    try:
        with open("feeds.json", "r", encoding="utf-8") as f:
            feeds = json.load(f)
    except Exception:
        feeds = []
    
    print(f"Loaded {len(feeds)} feeds")

    for i, post in enumerate(feeds):
        if post.get("likes", 0) == 0:
            post["likes"] = random.randint(30, 500)
            
        print(f"[{i+1}/{len(feeds)}] Generating comments for {post['characterName']}...")
        comments = await generate_comments(post)
        
        for c in comments:
            if c.get("reply"):
                c["reply"]["avatarUrl"] = post.get("avatarUrl", "/avatar.png")
                
        post["_commentData"] = comments
        post["comments"] = len(comments)
    
    with open("feeds.json", "w", encoding="utf-8") as f:
        json.dump(feeds, f, ensure_ascii=False, indent=4)
    print("Done! feeds.json updated with AI comments.")

if __name__ == "__main__":
    asyncio.run(main())
