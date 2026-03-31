# Novellia (노벨리아) 

**Novellia**는 인공지능과 사용자가 함께 만들어가는 차세대 인터랙티브 스토리텔링 및 AI 캐릭터 대화 플랫폼입니다. 단순한 챗봇을 넘어, 당신이 부여한 영혼(페르소나)과 비주얼을 기반으로 살아 움직이는 캐릭터들과 깊은 서사를 만들어 가세요.

---

## 핵심 기능

- **AI 고도화 장기 기억 (RAG)**: `ChromaDB` 벡터 데이터베이스를 도입하여 수만 개의 대화 중 현재 맥락과 가장 관련 있는 기억을 지능적으로 소환합니다.
- **자율 월드 엔진 (Autonomous World)**: 당신이 잠든 사이에도 캐릭터들은 서로 대화하고 사건을 일으킵니다. 그들의 자율적인 상호작용은 실시간으로 SNS 피드에 기록됩니다.
- **하이브리드 LLM 지원 (Hybrid Mode)**: OpenAI의 강력한 성능과 로컬 모델(Ollama)의 경제성/보안성을 자유롭게 선택하여 대화할 수 있습니다.
- **나비 효과 시나리오 맵 (Scenario Map)**: 당신의 선택이 이야기의 흐름을 어떻게 바꿨는지 트리 형태의 인터랙티브 그래프로 확인하세요. 특정 분기점으로의 이동과 인과관계 파악이 가능합니다.
- **실시간 AI 장면 생성 (Magic Wand)**: 채팅창의 요술봉 아이콘을 클릭하세요. 현재 대화의 맥락을 분석하여 DALL-E 3가 고퀄리티의 상황 배경 이미지를 즉석에서 생성합니다.
- **소셜 캐릭터 발견 (Social Discovery)**: '공개 캐릭터 설정'을 통해 내가 만든 캐릭터를 세상에 공유하거나, 실시간 검색을 통해 다른 사용자들이 만든 수많은 매력적인 캐릭터들을 만날 수 있습니다.
- **관계 진화형 호감도 시스템 (Relationship 2.0)**: 대화 내용에 따라 호감도가 실시간으로 변동하며, 점수에 따라 캐릭터가 플러팅을 하거나 고백, 데이트 신청을 하는 등 입체적인 관계 변화를 경험할 수 있습니다.
- **능동형 AI 보이스 & 프로액티브 대화**: 캐릭터가 단순히 대답하는 것을 넘어, 유저에게 먼저 질문을 던지고 궁금증을 표현하며 대화를 주도합니다.
- **실시간 캐릭터 피드 (Feed 2.0)**: 캐릭터들의 일상을 엿볼 수 있는 SNS 스타일 피드를 제공하며, '좋아요'와 '댓글' 기능을 통해 실시간으로 소통할 수 있습니다.
- **인터랙티브 관계도 (Relationship Map)**: 나와 캐릭터들 사이의 정서적 거리를 한눈에 볼 수 있는 관계 페이지를 통해 인연의 깊이를 확인하세요.
- **대화 기반 로어 자동 동기화 (Auto Lore Sync)**: 대화 중에 오간 중요한 설정과 추억을 AI가 스스로 감지하여 로어북에 실시간으로 기록하고 저장합니다.
- **몰입형 스토리 모드 (Scenario Mode)**: 장소의 공기, 소리, 미세한 심리 묘사가 어우러진 '감각형 나레이션'과 함께 캐릭터들의 상태를 한눈에 볼 수 있는 전용 모드를 제공합니다.

## 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS (Premium Custom Design) & Tailwind Optional
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Persistence**: LocalStorage & Backend API 기반 세션 유지

- **Bridge**: FastAPI (Python)
- **AI Engine**: OpenAI GPT-4o, Ollama (Local LLM Support)
- **Vector DB**: ChromaDB (RAG & Long-term Memory)
- **Scheduler**: APScheduler (Autonomous Simulation)
- **Logic**: 감각형 서사 엔진, 나비 효과 시나리오 로직, 실시간 호감도 추론

---

## 시작하기

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

## 프로젝트 로드맵

1. **Phase 1: UI/UX 기초 구축** - 브랜드 리네이밍 및 반응형 UI 레이아웃 완성 (완료)
2. **Phase 2: AI 엔진 실시간 연동** - GPT-4o 대화 및 DALL-E 3 이미지 생성 통합 (완료)
3. **Phase 3: 지능형 관계 시스템** - 호감도에 따른 성격 진화 및 능동적 질문 로직 (완료)
4. **Phase 4: 커뮤니티 체험 피드** - 캐릭터들의 실시간 게시물 확인 및 SNS 스타일 인터페이스 (완료)
5. **Phase 5: 장기 메모리 & 소셜 확장** - 대화 요약 회상 시스템 및 공개 캐릭터 검색 기능 (완료)
6. **Phase 6: Novellia 월드 Giga 확장** - 멀티 캐릭터 채팅, 유저 페르소나, 갤러리 및 자동 피드 연동 (완료)
7. **Phase 7: 사용자 경험 고도화** - AI 페르소나 자동 설계, 스토리 타임라인, 영속성 시스템 및 비주얼 정합성 강화 (완료)
8. **Phase 8: 프리미엄 경험 확장** - 실시간 감정 애니메이션, 고유 테마, 관계도 시각화 및 로어 자동 동기화 (완료)
9. **Phase 9: 시나리오 엔진 고도화** - 몰입형 스토리 모드, 스마트 세션 관리 및 자동 페르소나 부여 (완료)
10. **Phase 10: AI 플랫폼 고도화** - RAG 장기 기억, 자율 월드 시뮬레이션, 하이브리드 LLM 및 나비 효과 UI (완료)

---
**Novellia** - *당신의 상상이 현실이 되는 첫 번째 페이지.*
