# ReviseLog

프로젝트의 공식 변경 이력(Revision Log) 파일입니다. 모든 코드·문서·정책 변경은 아래 템플릿에 따라 항목을 추가해야 하며, 관련 문서에는 ReviseLog 항목 번호 또는 링크를 남기세요.

- 사용방법: 새 변경이 있을 때마다 맨 위에 새 항목을 추가합니다(역순: 최신 항목이 위).

## 템플릿

### [ID: RL-YYYYMMDD-NN]
- 날짜: YYYY-MM-DD HH:MM (KST)
- 작성자: (예: 홍길동)
- 변경 유형: (문서 / 코드 / 정책 / 기타)
- 변경 대상 파일/경로: (예: `/src/utils/api.js`, `README.md`)
- 변경 요약: 간단한 한 줄 요약
- 변경 상세 설명: 변경 이유, 영향 범위, 되돌리기 방법(필요시)
- 관련 PR/이슈: (URL 또는 번호)

---

## 예시(초기 항목)

### [ID: RL-20251119-01]
- 날짜: 2025-11-19 11:45 (KST)
- 작성자: 시스템(자동생성)
- 변경 유형: 문서
- 변경 대상 파일/경로: `README.md`, `WORKGUIDE.md`
- 변경 요약: 모든 변경 기록을 `ReviseLog.md`로 관리하도록 규칙 추가 및 ReviseLog 파일 생성
- 변경 상세 설명: 사용자 요청에 따라 기존 문서 내의 "변경 기록" 규정(문서 내 기록)을 ReviseLog 기반으로 대체하고, 프로젝트 루트에 ReviseLog 템플릿 파일을 추가함. 이후 모든 변경은 본 파일에 기록하고 관련 문서에서는 ReviseLog 항목 참조를 남김.
- 관련 PR/이슈: (초기화 작업)

---

(추가 항목을 여기에 계속 작성하세요)

### [ID: RL-20251119-06]
- 날짜: 2025-11-19 14:00 ~ 14:15 (KST)
- 작성자: 시스템(자동) + CEO 요청
- 변경 유형: 코드 + 문서
- 변경 대상 파일/경로: `lib/schemas/siteSettings.js`, `lib/settings.js`, `pages/admin/settings.jsx`, `pages/admin/settings.module.css`, `components/ContentBlur.jsx`, `components/ContentBlur.module.css`, `docs/ADMIN_SETTINGS.md`
- 변경 요약: 관리자 설정 시스템 구축 - CEO가 모든 기능을 On/Off 및 조정 가능
- 변경 상세 설명: CEO 요청에 따라 관리자 페이지에서 모든 기능을 직접 제어할 수 있는 설정 시스템 구축. Sanity CMS에 siteSettings 스키마 추가 (콘텐츠 제한 비율 10~100%, 광고 시청 시간 5~120초, 세션 시간 10~1440분, 댓글/인증/일반 설정 등), 설정 관리 API/Hook (getSiteSettings, updateSiteSettings, useSiteSettings), 관리자 페이지 UI (토글/슬라이더/체크박스, 비밀번호 인증), 기존 컴포넌트 동적 연동 (ContentBlur, CommentList). 신규 기능도 동일 패턴으로 추가 가능하도록 확장성 확보. 관리자 페이지 URL: /admin/settings, 기본 비밀번호: kulture2025 (환경변수로 변경 가능).
- 관련 PR/이슈: https://github.com/Borbino/Kulture/pull/2

---

### [ID: RL-20251119-05]
- 날짜: 2025-11-19 13:30 ~ 13:50 (KST)
- 작성자: 시스템(자동) + CEO 요청
- 변경 유형: 코드
- 변경 대상 파일/경로: `utils/contentRestriction.js`, `components/ContentBlur.jsx`, `components/ContentBlur.module.css`, `components/CommentList.jsx`, `components/CommentList.module.css`, `test/contentRestriction.test.js`, `docs/CONTENT_RESTRICTION.md`
- 변경 요약: 비회원 콘텐츠 제한 기능 + 광고 시청 대체 기능 구현
- 변경 상세 설명: CEO 요청에 따라 회원가입/로그인 유도를 위한 콘텐츠 제한 기능과 광고 시청 대체 경로 구현. 비회원은 게시물 본문 40%, 댓글 40%, 이미지 처음 2개만 표시하고 나머지는 블러/잠금 처리. **광고 시청 기능**: Google AdSense 통합, 30초 광고 시청 시 1시간 콘텐츠 접근 권한 부여, localStorage 기반 세션 관리(AdWatchSession 클래스), 타이머 UI 및 자동 잠금 해제. ContentBlur 컴포넌트(3단계 UI: 잠금→옵션→광고), CommentList 컴포넌트, contentRestriction 유틸리티, 테스트 코드 및 가이드 문서 포함. 프리미엄(로그인) vs 무료(광고) 경로 제공으로 수익 다변화.
- 관련 PR/이슈: https://github.com/Borbino/Kulture/pull/2

---

### [ID: RL-20251119-04]
- 날짜: 2025-11-19 13:00 (KST)
- 작성자: 시스템(자동)
- 변경 유형: 코드 + 문서
- 변경 대상 파일/경로: `package.json`, `tsconfig.json`, `next.config.js`, `.env.example`, `.eslintrc.json`, `.prettierrc`, `lib/sanityClient.js`, `lib/schemas/*.js`, `jest.config.js`, `docs/*.md`, `.gitignore`, `.vscode/*`
- 변경 요약: 프로젝트 기초 구조 및 환경 세팅 완료 (Next.js + Sanity + TypeScript + 테스트 + 보안 정책)
- 변경 상세 설명: README와 WORKGUIDE 기반으로 프로젝트 기본 폴더 구조(/src, /components, /utils, /lib, /pages, /test, /docs), Next.js 설정, Sanity CMS 클라이언트 및 스키마(Post/Category/Author), TypeScript, ESLint/Prettier, Jest 테스트 환경, 환경변수 관리 가이드, 개인정보보호 및 저작권 정책 초안을 생성. 모든 설정은 프로젝트 원칙 v12.0을 준수하며 무료 플랜(Vercel/Sanity/GitHub) 최대 활용 구조로 설계됨.
- 관련 PR/이슈: https://github.com/Borbino/Kulture/pull/2

---

### [ID: RL-20251119-03]
- 날짜: 2025-11-19 12:40 (KST)
- 작성자: 시스템(자동)
- 변경 유형: 문서
- 변경 대상 파일/경로: `AGENT_POLICY.md`, `AGENT_USAGE.md`, `PR_TEMPLATE.md`, `REVIEW_SUMMARY.md`, `.github/workflows/revise_log_check.yml`, `README.md`, `WORKGUIDE.md`, `ReviseLog.md`
- 변경 요약: Agent 정책·사용 가이드·PR 템플릿 및 CI 워크플로우 추가
- 변경 상세 설명: 프로젝트의 자동화 작업을 안전하게 운영하기 위한 문서와 워크플로우를 추가함. ReviseLog 규칙과 PR 검사 워크플로우를 통해 자동 변경의 투명성 및 CI 보장을 강화함.
- 관련 PR/이슈: https://github.com/Borbino/Kulture/pull/1

---

### [ID: RL-20251119-02]
- 날짜: 2025-11-19 12:30 (KST)
- 작성자: CEO
- 변경 유형: 문서
- 변경 대상 파일/경로: `README.md`
- 변경 요약: 프로젝트 도메인 `kulture.wiki` 정보 추가
- 변경 상세 설명: 프로젝트 소유자가 도메인 `kulture.wiki`를 구매했음을 README에 명시함. 이 변경은 문서화 목적이며 실행 코드에는 영향 없음.
- 관련 PR/이슈: (자동 패치 적용)
