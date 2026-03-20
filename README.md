# ⚡ KULTURE.NET
### Fully Autonomous K-Culture AI Magazine & Revenue Empire

> **"The world speaks K-Culture. Kulture speaks back — autonomously."**  
> Whitepaper v1.0 · Phase 1–11 Complete · March 2026


---

## 💡 프로젝트 비전 (Vision)

**Kulture.net**은 단순한 K-Pop 뉴스 사이트가 아니다.  
이것은 **인간의 개입 없이 스스로 콘텐츠를 생성·번역·배포하고, 유저를 락인(Lock-in)하며, 광고 수익을 극대화**하는 — 세계 최초의 **완전 자율형 K-Culture 수익 제국**이다.

> Phase 1부터 Phase 10까지, 10개의 핵심 엔진이 유기적으로 연결되어  
> **트래픽 → 팬덤 → 수익**의 선순환 플라이휠(Flywheel)을 완성했다.

---

## 🏛️ 핵심 아키텍처 — The 4 Pillars

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KULTURE.NET EMPIRE                           │
│                                                                     │
│  🧠 PILLAR I          🌐 PILLAR II        🎮 PILLAR III  💰 PILLAR IV│
│  Zero-Cost            Dynamic             Fandom          Revenue   │
│  AI Engine            Multi-SEO           Lock-In         Optimizer │
│                                                                     │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐  ┌─────────┐ │
│  │ Crawler  │──────▶ │ DeepL    │──────▶ │Gamifica- │  │ A/B     │ │
│  │ GPT/Claude│       │Fallback  │        │tion Eng. │  │ Engine  │ │
│  │ Sanity   │        │200 Langs │        │Daily Mis.│  │ AdPlace │ │
│  │ Cron Auto│        │SNS Auto  │        │Lv/Badges │  │Winner   │ │
│  └──────────┘        └──────────┘        └──────────┘  │AutoRoute│ │
│                                                         └─────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 🧠 Pillar I — 무자본 자율 탐지 및 AI 콘텐츠 생성 엔진

| 컴포넌트 | 역할 |
|----------|------|
| `lib/aiModelCrawler.js` | YouTube·Twitter·Reddit 실시간 K-Culture 트렌드 자동 탐지 |
| `lib/aiContentGenerator.js` | 탐지된 트렌드를 GPT-4o / Claude 3.5 Sonnet으로 전문 기사 자동 생성 |
| `lib/advancedContentGeneration.js` | SEO 최적화 메타태그·슬러그·구조화 데이터 자동 주입 |
| `lib/aiModelManager.js` | AI 모델 비용·품질 모니터링 및 자동 최적 모델 선택 |
| `pages/api/cron/` | Vercel Cron으로 매일 자동 실행 (Zero Human Intervention) |

**핵심 가치**: $0 크롤링 비용 + AI 기사 생성으로 **무한 콘텐츠 공급**

---

### 🌐 Pillar II — 200개국 동적 다국어 SEO & SNS 자동 확성기

| 컴포넌트 | 역할 |
|----------|------|
| `lib/aiTranslation.js` | DeepL(1순위) → Claude → GPT-4o → Gemini → Google 6단 폴백 번역 |
| `lib/translationCache.js` | SHA-256 해시 기반 LRU 캐시 (10만 엔트리, TTL 30일, Zero-Cost 재번역) |
| `components/SEOHead.jsx` | hreflang 200개국, Open Graph, Twitter Card, JSON-LD 동적 생성 |
| `pages/api/cron/self-maintenance.js` | 매주 일요일 자정 AI 자가 리팩토링 (Self-Evolution Loop) |
| `next-sitemap.config.js` | 전체 다국어 사이트맵 자동 생성 |
| SNS Auto-posting | 기사 발행 시 X(Twitter)·Facebook 자동 공유 |

**핵심 가치**: **번역 비용 90%+ 절감** + 200개 언어 Google 상위 노출

---

### 🎮 Pillar III — 글로벌 팬덤 락인 게이미피케이션 엔진

| 컴포넌트 | 역할 |
|----------|------|
| `lib/gamificationEngine.js` | 7단계 레벨(Rookie → K-Culture God), 5종 배지, 포인트 적립 엔진 |
| `components/DailyMissions.jsx` | 매일 미션 CLAIM UI — 체류시간·재방문율 극대화 |
| `components/Navbar.jsx` | EXP 뱃지 상시 노출 — 유저 성장 욕구 자극 |
| `components/RealtimeChat.jsx` | 실시간 글로벌 팬덤 커뮤니티 (Supabase Realtime) |
| `pages/leaderboard.jsx` | 글로벌 랭킹 — 경쟁 심리 기반 락인 |
| `components/ActivityFeed.jsx` | 커뮤니티 활동 피드 |

**핵심 가치**: **DAU·체류시간·재방문율** 극대화 → 광고 수익 직결

---

### 💰 Pillar IV — AI 자율 A/B 테스트 수익 극대화 로직

| 컴포넌트 | 역할 |
|----------|------|
| `lib/abTestingEngine.js` | Variant A/B/C 자동 배정, CTR·Dwell 기반 Winner 자동 선정 |
| `components/AdPlacement.jsx` | Variant 연동 동적 광고 배너 (애드센스 + 모의 배너) |
| `pages/index.jsx` | 피드 4번째 카드마다 인라인 광고 자동 삽입 |
| `pages/posts/[slug].jsx` | 기사 본문 최고 주목도 위치 광고 삽입 |
| `pages/admin/` | CEO 전용 수익 대시보드 |

**핵심 가치**: **Winner 확정 후 90% 트래픽 자동 라우팅** → 광고 CTR 극대화

---

## 🛠️ 기술 스택 (Tech Stack)

| 레이어 | 기술 | 용도 |
|--------|------|------|
| **Frontend** | Next.js 14 (Pages Router) | SSG/ISR 하이브리드 렌더링 |
| **CMS** | Sanity.io | 헤드리스 콘텐츠 관리 |
| **Hosting** | Vercel | 자동 배포, Serverless Functions, Cron |
| **DB/Auth** | Supabase | 실시간 채팅, 유저 인증, 게이미피케이션 DB |
| **AI — 번역** | DeepL API | 1순위 고품질 번역 |
| **AI — 생성** | OpenAI GPT-4o | 기사 생성, 콘텐츠 분석 |
| **AI — 폴백** | Claude 3.5 Sonnet, Gemini 1.5 Flash | 다단계 AI 폴백 체인 |
| **번역 캐시** | In-Memory LRU (lib/translationCache) | Zero-Cost 재번역 방지 |
| **국제화** | next-i18next | 다국어 라우팅 & 번역 파일 |
| **에러 추적** | Sentry | 실시간 에러 모니터링 |
| **SEO** | next-sitemap, JSON-LD | 검색 엔진 최적화 |
| **A/B 테스트** | lib/abTestingEngine (Custom) | Winner-based 트래픽 라우팅 |
| **광고** | Google AdSense | 수익화 |
| **모바일** | Capacitor.js | iOS/Android 래핑 |
| **스타일** | CSS Modules + 글래스모피즘 | 디자인 시스템 |

---

## 📅 개발 연혁 (Phase History)

| Phase | 코드명 | 핵심 성과 |
|-------|--------|-----------|
| Phase 1–5 | Bootstrap | Next.js 구조, Sanity CMS, 기본 커뮤니티, SEO 기반 |
| Phase 6 | CEO Dashboard | 실시간 수익/트래픽 KPI 대시보드 |
| Phase 7 | Magazine Design | Glassmorphism 디자인 시스템, Navbar/Footer/MagazineCard |
| Phase 8-01 | AI Self-Evolution | DeepL 6단 폴백 번역 + Self-Maintenance AI 대시보드 |
| Phase 8-02 | Zero-Cost Cache | 번역 LRU 캐시 + Vercel Cron 자동화 |
| Phase 9 | Gamification | 7레벨 포인트 엔진 + 데일리 미션 UI + EXP Navbar 뱃지 |
| Phase 10 | A/B Revenue | AI 자율 A/B 테스트 엔진 + 동적 광고 배치 시스템 |
| **Phase 11** | **Launch** | **README 백서화 + 런칭 체크리스트 발급 — 개발 완료 선언** |

---

## 📊 목표 운영 지표 (KPI Targets)

| 지표 | 목표치 | 달성 전략 |
|------|--------|-----------|
| 월간 방문자 (MAU) | 500,000+ | 200개국 SEO + SNS 자동 확성기 |
| 평균 체류 시간 | 4분 30초+ | 게이미피케이션 + 데일리 미션 |
| 재방문율 (Retention) | 40%+ | 레벨/배지 + 리얼타임 커뮤니티 |
| 광고 CTR | 3.5%+ | A/B 테스트 Winner 자동 라우팅 |
| 번역 비용 절감 | 90%+ | Zero-Cost 캐시 게이트 |
| 휴먼 인터벤션 | 0시간/주 | Vercel Cron 완전 자동화 |

---

## 📁 프로젝트 문서 체계

| 파일 | 내용 |
|------|------|
| **README.md** (본 파일) | 제국 백서 — 아키텍처, 비전, 기술 스택 |
| **LAUNCH_CHECKLIST.md** | CEO 런칭 체크리스트 — 환경변수·Vercel·도메인 |
| **WORKGUIDE.md** | AI 에이전트 운영 지침, 코딩 컨벤션, Git 워크플로우 |
| **ReviseLog.md** | 공식 패치로그 (Phase 1~11 전체 변경 이력) |
| **docs/TECHNICAL_HANDBOOK.md** | 기술 명세서 (AI 기능, 번역 시스템, API 구조) |
| **docs/OPS_PLAYBOOK.md** | 운영/배포 가이드, 비용 최적화 전략 |

---

## 🚀 빠른 시작 (Quick Start)

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 복사 후 키 입력
cp .env.example .env.local
# → LAUNCH_CHECKLIST.md 참조하여 모든 API 키 입력

# 3. 로컬 개발 서버 실행
npm run dev

# 4. 빌드 검증
npm run build

# 5. Vercel 배포 (CLI)
vercel --prod
```

---

## ⚖️ 법적 고지

- 모든 K-Culture 콘텐츠는 공정 사용(Fair Use) 원칙 및 저작권 정책([docs/COPYRIGHT_POLICY.md](docs/COPYRIGHT_POLICY.md))을 준수합니다.
- 개인정보 처리는 GDPR/CCPA 준수 ([docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)) 합니다.
- AI 크롤러는 robots.txt를 존중합니다 ([docs/CRAWLER_POLICY.md](docs/CRAWLER_POLICY.md)).

---

<div align="center">

**Built with ❤️ by GitHub Copilot (Claude Sonnet 4.6)**  
**CEO: Borbino · Kulture.net · March 2026**

*"The greatest K-Culture empire the internet has ever seen."*

</div>
