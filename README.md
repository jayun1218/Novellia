# Novellia (노벨리아) 🎭

**Novellia**는 인공지능과 사용자가 함께 만들어가는 차세대 인터랙티브 스토리텔링 및 AI 캐릭터 대화 플랫폼입니다. 단순한 챗봇을 넘어, 당신이 부여한 영혼(페르소나)과 비주얼을 기반으로 살아 움직이는 캐릭터들과 깊은 서사를 만들어 가세요.

---

## ✨ 핵심 기능

- **실시간 AI 이미지 생성 (Dall-E 3)**: 캐릭터의 외모를 텍스트로 묘사하면, 즉석에서 고퀄리티 한국 웹소설풍 아바타와 커버 이미지를 생성합니다.
- **관계 진화형 호감도 시스템 (Relationship 2.0)**: 대화 내용에 따라 호감도가 실시간으로 변동하며, 점수에 따라 캐릭터가 플러팅을 하거나 고백, 데이트 신청을 하는 등 입체적인 관계 변화를 경험할 수 있습니다.
- **능동형 AI 보이스 & 프로액티브 대화**: 캐릭터가 단순히 대답하는 것을 넘어, 유저에게 먼저 질문을 던지고 궁금증을 표현하며 대화를 주도합니다.
- **카카오톡/SNS 스타일 플랫폼 UI**: 친숙한 모바일 메신저 스타일의 프로필 모달과 캐릭터들의 일상을 엿볼 수 있는 '캐릭터 피드(Feed)' 기능을 제공합니다.
- **포맷 기반 장면 전환 및 타임스킵**: `*...*`(행동), `(...)`(심리/상황) 구분 시스템을 통해 시간 경과와 장소 이동이 포함된 한 편의 소설 같은 스토리텔링이 가능합니다.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Glassmorphism & Dark Mode)
- **State Management**: React Hooks (usePathname 등 경로 동적 감지 포함)

### Backend
- **Framework**: FastAPI (Python)
- **AI Engine**: OpenAI GPT-4o (Reasoning & Chat), DALL-E 3 (Image Rendering)
- **Logic**: 실시간 호감도 점수 추론 및 페르소나 브로드캐스팅 엔진

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
3. **Phase 3: 지능형 관계 시스템** - 호감도에 따른 성격 진화 및 능동적 질문 로직 (✅ 완료)
4. **Phase 4: 커뮤니티 체험 피드** - 캐릭터들의 실시간 게시물 확인 및 SNS 스타일 인터페이스 (✅ 완료)
5. **Phase 5: 장기 메모리 & 멀티 엔딩** - 과거 대화 회상 시스템 및 선택지에 따른 엔딩 분기 (진행 예정)

---
**Novellia** - *당신의 상상이 현실이 되는 첫 번째 페이지.*
