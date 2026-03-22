# Novellia (노벨리아) 🎭

**Novellia**는 인공지능과 사용자가 함께 만들어가는 차세대 인터랙티브 스토리텔링 및 AI 캐릭터 대화 플랫폼입니다. 단순한 챗봇을 넘어, 당신이 부여한 영혼(페르소나)과 비주얼을 기반으로 살아 움직이는 캐릭터들과 깊은 서사를 만들어 가세요.

---

## ✨ 핵심 기능

- **실시간 AI 이미지 생성 (DALL-E 3)**: 캐릭터의 외모를 텍스트로 묘사하면, 즉석에서 고퀄리티 한국 웹소설풍 아바타를 생성하고 시안을 선택할 수 있습니다.
- **페르소나 기반 GPT-4o 채팅**: 캐릭터별 고유한 가치관, 말투, 숨겨진 배경 서사를 완벽히 반영한 몰입감 넘치는 대화 경험을 제공합니다.
- **커스텀 캐릭터 소환**: 이름부터 첫 대사, 상세 페르소나, 로어북까지 직접 설정하여 나만의 캐릭터를 창조하고 메인 피드에 공개할 수 있습니다.
- **장면 묘사 및 액션 가이드**: `*지시문*` 시스템을 활용해 대화와 장면 묘사를 자유롭게 넘나들며 한 편의 소설과 같은 이야기를 제작할 수 있습니다.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Glassmorphism & Dark Mode)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **AI Engine**: OpenAI GPT-4o (Chat), DALL-E 3 (Image)
- **Environment**: Python Dotenv (.env 관리)

---

## 🚀 시작하기

### 1. API 키 설정 (백엔드)
`backend/.env` 파일을 생성하거나 수정하여 OpenAI API 키를 입력합니다.
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 프론트엔드 (Frontend) 실행
```bash
cd frontend
npm install
npm run dev
```

### 3. 백엔드 (Backend) 실행
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📅 프로젝트 로드맵

1. **Phase 1: UI/UX 기초 구축** - 브랜드 리네이밍 및 반응형 UI 레이아웃 완성 (✅ 완료)
2. **Phase 2: AI 엔진 실시간 연동** - GPT-4o 대화 및 DALL-E 3 이미지 생성 통합 (✅ 완료)
3. **Phase 3: 장기 메모리 시스템** - 에피소드 요약 및 회상 기능 (예정)
4. **Phase 4: 커뮤니티 고도화** - 캐릭터 피드 공유 및 인터랙티브 스토리텔링 툴킷 (예정)

---
**Novellia** - *당신의 상상이 현실이 되는 첫 번째 페이지.*
