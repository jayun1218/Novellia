# Novellia (노벨리아) 🎭

**Novellia**는 인공지능과 사용자가 함께 만들어가는 인터랙티브 스토리텔링 및 AI 캐릭터 대화 플랫폼입니다. '제타(Zeta)'의 한계를 뛰어넘어, 더 깊은 기억력과 일관성 있는 성격을 가진 AI 파트너와 잊지 못할 이야기를 써 내려가세요.

---

## ✨ 주요 기능

- **장기 메모리 시스템 (Long-term Memory)**: 대화가 길어져도 앞선 약속이나 중요한 설정을 잊지 않는 독자적인 3계층 메모리 구조를 탑재했습니다.
- **캐릭터 일관성 엔진**: 대화 도중 캐릭터의 성격이 붕괴되는 현상을 방지하여, 몰입감 넘치는 역할극 경험을 제공합니다.
- **지시문 액션 시스템**: `*행동*` 입력을 통해 소설과 같은 장면 묘사와 대화를 넘나드는 풍부한 상호작용이 가능합니다.
- **반응형 멀티 디바이스 지원**: 웹(데스크톱)과 모바일 앱 환경 각각에 최적화된 세련된 다크 모드 UI를 제공합니다.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Glassmorphism UI)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **AI Engine**: OpenAI GPT-4o
- **Vector DB**: ChromaDB (장기 메모리 관리)
- **Auth**: Supabase Auth

---

## 🚀 시작하기

### 프론트엔드 (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 백엔드 (Backend)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 📅 프로젝트 로드맵

1. **Phase 1: UI/UX 기초 구축** - 브랜드 리네이밍 및 반응형 UI 레이아웃 완성 (진행 중)
2. **Phase 2: AI 엔진 및 스트리밍 연동** - GPT-4o 핵심 대화 로직 구현
3. **Phase 3: 장기 메모리 및 벡터 DB 통합** - 에피소드 요약 및 회상 기능 추가
4. **Phase 4: 커뮤니티 및 수익화 모델** - 캐릭터 피드 공유 및 크레딧 시스템 도입

---
**Novellia** - *당신의 상상이 현실이 되는 첫 번째 페이지.*
