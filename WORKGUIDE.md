# Kulture — 프로젝트 원칙 v12.0 및 무결점 글로벌 커뮤니티/플랫폼 작업지침서 + 완전무결 적용/실전 매뉴얼화판

---

## 🚨 최우선 절대 원칙 (CRITICAL PRIORITY)

**이 섹션의 원칙들은 모든 다른 규칙에 우선하며, 절대 위반할 수 없습니다.**

### 문서 기반 개발 철칙

**README.md와 WORKGUIDE.md는 이 프로젝트의 헌법이며 절대적 기준입니다.**

**핵심 규칙**:

1. **📘 문서 = 법률**: README.md와 WORKGUIDE.md의 내용은 절대적 권위를 가짐
2. **🔄 문서-코드 동기화**: 문서와 코드는 항상 100% 일치해야 함
3. **⚠️ 불일치 발생 시**:
   - 문서 내용에 맞춰 코드를 즉시 수정
   - 불일치 사항을 ReviseLog.md에 기록
   - CEO에게 보고
4. **🔧 CEO 요청 처리**:
   - CEO 요청이 문서와 다를 경우: 요청에 맞춰 작업 + 문서도 함께 업데이트
   - 변경사항을 ReviseLog.md에 상세 기록
   - 문서 업데이트 누락 시 작업 무효

**작업 프로세스**:

```
CEO 요청 접수
    ↓
README.md/WORKGUIDE.md 확인
    ↓
문서와 일치?
    ├─ Yes → 작업 수행
    └─ No → 문서에 맞춰 조정 OR (CEO 요청이 우선일 경우) 작업 + 문서 업데이트
    ↓
작업 완료
    ↓
문서-코드 일치 확인
    ↓
ReviseLog.md 기록
```

**우선순위**:

```
1순위: CEO의 명시적 요청
2순위: README.md / WORKGUIDE.md
3순위: 기타 모든 원칙 및 관례
```

---

## 0. 필수 준수 사항: ReviseLog.md 패치로그 관리

**🚨 중요: ReviseLog.md는 이 프로젝트의 공식 패치로그입니다.**

### 변경 이력 관리 철칙

**모든 변경사항(코드/문서/설정/정책)은 반드시 `ReviseLog.md`에 기록해야 합니다.**

**필수 기록 항목**:

- 날짜 및 시간 (KST)
- 작성자 (AI/개발자 이름)
- 변경 유형 (코드/문서/정책/기타)
- 변경 대상 파일/경로
- 변경 요약 (한 줄)
- 변경 상세 설명 (이유, 영향 범위, 되돌리기 방법)
- 관련 PR/이슈 번호

**적용 규칙**:

1. ✅ 변경 작업 완료 즉시 ReviseLog에 기록
2. ✅ 기록 없는 변경은 무효 (반드시 사후 기록)
3. ✅ ID 형식: `[ID: RL-YYYYMMDD-NN]`
4. ✅ 최신 항목이 맨 위 (역순 정렬)
5. ❌ 관련 문서에 변경 내용 중복 기록 금지 (ReviseLog ID만 참조)

**예시**:

```markdown
### [ID: RL-20251119-10]

- 날짜: 2025-11-19 17:00 (KST)
- 작성자: GitHub Copilot
- 변경 유형: 코드
- 변경 대상: components/ContentBlur.jsx
- 변경 요약: 광고 세션 시간 버그 수정
- 변경 상세 설명: markAdWatched() 인자 전달 오류 수정...
- 관련 PR/이슈: N/A
```

---

## 0-1. Git 워크플로우 원칙 (필수)

**🚨 중요: 모든 변경사항은 Pull Request(PR) 방식으로 관리합니다.**

### PR 기반 개발 워크플로우

**절대 규칙**:

- ❌ **main 브랜치에 직접 커밋/푸시 금지**
- ✅ **모든 변경은 feature 브랜치 → PR → 병합 순서로만 진행**

**표준 워크플로우**:

```bash
# 1. 최신 main 브랜치로 업데이트
git checkout main
git pull origin main

# 2. 새 feature 브랜치 생성
git checkout -b feature/새기능명
# 또는
git checkout -b fix/버그명

# 3. 작업 수행 및 테스트
# ... 코드 작성 ...
npm test
npm run lint

# 4. 변경사항 커밋
git add .
git commit -m "feat: 새 기능 추가 설명"

# 5. 원격 저장소에 푸시
git push origin feature/새기능명

# 6. GitHub에서 Pull Request 생성
# - Base: main
# - Compare: feature/새기능명
# - 제목: 커밋 메시지 규칙 준수
# - 설명: 변경 이유, 테스트 결과, 스크린샷 등

# 7. 코드 리뷰 및 승인 대기

# 8. 병합 완료 후 로컬 정리
git checkout main
git pull origin main
git branch -d feature/새기능명
```

### 브랜치 네이밍 규칙

| 타입          | 형식             | 예시                     | 설명                            |
| ------------- | ---------------- | ------------------------ | ------------------------------- |
| 기능 추가     | `feature/기능명` | `feature/social-login`   | 새로운 기능 개발                |
| 버그 수정     | `fix/버그명`     | `fix/comment-bug`        | 버그 수정                       |
| 문서 업데이트 | `docs/문서명`    | `docs/update-readme`     | README, 가이드 등 문서 변경     |
| 리팩토링      | `refactor/대상`  | `refactor/api-structure` | 코드 구조 개선 (기능 변경 없음) |
| 테스트        | `test/테스트명`  | `test/unit-tests`        | 테스트 코드 추가/수정           |
| 스타일        | `style/대상`     | `style/css-modules`      | 코드 포맷팅, CSS 변경           |
| 빌드/설정     | `chore/작업명`   | `chore/update-deps`      | 의존성 업데이트, 설정 변경      |

### 커밋 메시지 규칙 (Conventional Commits)

**형식**: `<type>: <subject>`

**타입**:

- `feat:` 새 기능 추가
- `fix:` 버그 수정
- `docs:` 문서만 변경
- `style:` 코드 의미에 영향 없는 변경 (포맷팅 등)
- `refactor:` 버그 수정이나 기능 추가가 아닌 코드 변경
- `test:` 테스트 추가 또는 수정
- `chore:` 빌드 프로세스, 도구 설정 변경

**예시**:

```bash
feat: add Google OAuth login functionality
fix: resolve comment display issue on mobile
docs: update API documentation for v2.0
refactor: simplify contentRestriction logic
test: add unit tests for settings component
chore: upgrade Next.js to 16.0.3
```

### PR 생성 가이드

**PR 제목**:

- 커밋 메시지 규칙 준수
- 명확하고 간결하게 (50자 이내 권장)

**PR 설명 템플릿**:

```markdown
## 변경 사항

- 무엇을 변경했는지 요약

## 변경 이유

- 왜 이 변경이 필요한지 설명

## 테스트 결과

- [ ] ESLint 통과
- [ ] Jest 테스트 통과
- [ ] 로컬 환경 테스트 완료

## 스크린샷 (UI 변경 시)

- 변경 전/후 비교

## 참조

- 관련 이슈 번호: #123
- ReviseLog ID: RL-20251120-05
```

### 코드 리뷰 체크리스트

**리뷰어 확인 사항**:

- [ ] 코드가 원칙 v14.0을 준수하는가?
- [ ] 모든 테스트가 통과하는가?
- [ ] ESLint 에러가 없는가?
- [ ] 문서가 업데이트되었는가?
- [ ] ReviseLog.md에 기록되었는가?
- [ ] 보안 취약점이 없는가?
- [ ] 성능 이슈가 없는가?

### 긴급 수정 (Hotfix) 프로세스

긴급한 프로덕션 버그 수정 시:

```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/긴급버그명

# 2. 수정 및 테스트
# ... 버그 수정 ...

# 3. 커밋 및 푸시
git commit -m "fix: 긴급 버그 수정 설명"
git push origin hotfix/긴급버그명

# 4. PR 생성 (라벨: hotfix 추가)

# 5. 신속 리뷰 및 병합
```

---

## 1. 프로젝트 비전 및 전략적 목표

- 대한민국 K-Culture(Drama, K-Pop, Movie, Beauty 등)의 실시간/자동/고품질 글로벌 공유
- 대형 커뮤니티/플랫폼을 **최고 수준 자동화·수익성·트래픽·사용자 경험·법적 신뢰성** 기준으로 구축
- 모든 운영/코드/의사결정은 **'프로젝트 원칙 v12.0'** 및 최신 글로벌 윤리/법 기준을 100% 우선 적용

### ⚙️ 관리자 설정 시스템 (원칙 12)

모든 기능은 CEO가 관리자 페이지에서 직접 제어할 수 있도록 설계:

- **접속**: `https://kulture.wiki/admin/settings`
- **인증**: 환경변수 `NEXT_PUBLIC_ADMIN_PASSWORD` (기본: kulture2025)
- **설정 가능 항목**:
  - 콘텐츠 제한 비율: 10~100%
  - 광고 시청 시간: 5~120초
  - 세션 유효 시간: 10~1440분
  - 댓글, 인증, 점검 모드 등 모든 기능 On/Off

**신규 기능 추가 시 필수 4단계**:

1. `lib/schemas/siteSettings.js`에 필드 추가
2. `lib/settings.js` DEFAULT_SETTINGS 업데이트
3. `pages/admin/settings.jsx`에 UI 추가
4. 컴포넌트에서 `useSiteSettings()` 사용

상세: `docs/ADMIN_SETTINGS.md`

### 📊 K-Culture 콘텐츠 수집 정책 (원칙 13)

**수집 대상**: K-Pop, K-Drama, K-Movie, K-Food, K-Beauty, K-Fashion, K-Game, K-Webtoon 등

**합법적 수집 방법**:

- ✅ 공식 API 우선 사용 (YouTube Data API, Twitter API 등)
- ✅ RSS/Atom 피드 활용
- ✅ robots.txt 준수 및 Rate Limiting
- ✅ 출처 명확 표기 + 원본 링크 제공
- ✅ 요약/재구성 (원문 복사 금지)
- ❌ VPN 우회 금지
- ❌ 과도한 크롤링 금지
- ❌ 개인정보 무단 수집 금지

**2차 검증 시스템**: 팩트체크 및 신뢰도 평가 필수

상세: `docs/CRAWLER_POLICY.md`

---

## 2. 이해관계자별 실전 시나리오 + 직접 경험 매뉴얼

### - 사용자(일반, 고령, 외국인)

**실제 경험 흐름**

- 사이트 첫 화면에서 바로 언어/글씨크기/음성 안내 등 배리어프리 접근
- 드라마·K팝·빠른 최신 콘텐츠·추천·실시간 댓글·검색
- 도움말·FAQ·문의 버튼(쉽게 질문/불편 접수)

**FAQ**

- 글씨가 작아요 → 상단 [크게] 버튼
- 영어/중국어/일본어 가능? → 자동 번역 메뉴
- 로그인 방법? → 이메일·휴대폰·간편소셜 가입(3초 이내)

---

### - 운영자/관리자

**일상 작업**

- 관리자 대시보드: 가입자/트래픽/댓글/신고 현황 실시간
- 장애/이상 발생시 → 자동 경고음+수동/자동 복구 버튼 실행(1클릭 복구)
- 데이터 백업/복구, 회원 등급/블랙리스트 관리, 새 소식/공지 업로드, 팀 교육자료 활용

**비상대응 프로세스**

- 장애/법적 이슈 발생 → 관리자에 자동 알림/복구 시나리오/핫라인
- 악성글/스팸 → 신고 즉시 차단, 복구 기록 남김, 법무팀 협의

---

### - 개발자/디자이너/협력자

**작업 기준**

- 코드 작성시 항상 범용 함수/라이브러리 사용(복잡함보다 유지보수/팀 표준 중시)
- 함수 첫 주석에 "기능 설명+KST 일시"/특수코드 근거 반드시 기록
- 파일구조: `/src`, `/components`, `/utils`, `/lib`, `/pages`, `/test`, 각 주요 역할·주석 표준화

**코드 예시(크롤러)**

```javascript
// [설명] K-드라마 커뮤니티 인기글 자동 크롤링 후 DB 저장
// [일시] 25/11/19 오전 10시 59분 (KST)
function collectKDramaNews() {
  // 크롤러 : puppeteer/scrapy 등 범용 라이브러리
  // robots.txt 체크, 장애 시 백업·수동 플래그, 데이터 DB 저장
}
```

- 모든 추가/수정/특수 함수(고성능·특화 필요시)는 반드시 왜/언제/누가·일시·근거 주석화

**새 기능/장애발생시**

- 항상 README에 예시 코드/복구 매뉴얼/수정 이력 등 즉시 추가기록

---

### - CEO/법무/시장/기여자

- 주요 정책/법률변경·광고/수익전환·시장분석자료 모두 매뉴얼·대시보드·팀 교육에 반영
- 외부 협력·API 연동·오픈소스 기여방법 명시 : Pull Request, 코드 리뷰, Issue·변경이력

---

## 3. 장애복구, 비상대응, 이력/교육/테스트 실전 워크플로우

### 3.1 장애복구 예시(서버 다운)

- 장애 알림 → 관리자 대시보드 복구버튼 클릭
- 자동 로그기록, 데이터 백업 복원, 이용자 공지(화면 자동표시)
- 문제 원인 분석, 기록/재발 방지 업데이트, 사후교육 자료로 전환
- FAQ : "서버 장애가 발생하면 1분 내 자동/수동 복구가 실행되고 이용자에 알림 화면 안내"

### 3.2 비상대응/정책변경/협업

- **주요 기능/법/시장 이슈 → 반드시 `ReviseLog.md`에 일자·작업자·변경점 기록**
- **새로운 버그/취약점 발견시 즉시 `ReviseLog.md`에 기록 후 복구/교육·대응 시나리오 추가**
- 운영팀/개발팀/법무팀 정기 교육, 교육자료/영상/실습 FAQ 기록(누구나 따라할 수 있게)
- **모든 변경사항의 단일 진실 공급원(Single Source of Truth)은 `ReviseLog.md`**

### 3.3 데이터/보안/법/시장관리

- 개인정보/저작권/민감정보·광고/결제·현지화 등은 상세 매뉴얼·위반/오류 시 워크플로우 기록
- 백업/암호화/복구 시나리오별 실제 예시·매뉴얼·사진·팀 핫라인·사후 보고
- 정책/API 키·민감정보 관리: 분실/유출시 처리방법(즉시 변경, 기록, 책임자 지정)

---

## 4. 파일 구조/작업 예시/변경이력 관리(실전 기록)

### 4.1 파일 구조(예시)

- `/src`: 주요 기능(크롤러/게시판/검색/UI)
- `/components`: 공통 UI(버튼/메뉴/검색/상세보기)
- `/utils`: 데이터 처리, API 호출, 에러 핸들러
- `/lib`: DB 통신, 외부 라이브러리, 인증/로그인 모듈
- `/test`: 기능별 테스트케이스, 장애복구 시나리오, 실제 예시코드 포함
- `/docs`: 정책, API 명세/FAQ/교육자료
- **`ReviseLog.md`**: 프로젝트 루트, 모든 변경사항의 공식 패치로그 (필수)

### 4.2 변경이력 기록(로그 예시)

- **필수:** 모든 변경 기록은 프로젝트 루트의 `ReviseLog.md`에 기록합니다.
- **ReviseLog.md는 프로젝트의 공식 패치로그이며 단일 진실 공급원(Single Source of Truth)입니다.**
- **기록 방법**:
  1. 변경 작업 완료 즉시 ReviseLog.md에 새 항목 추가 (맨 위에 역순 추가)
  2. 항목 ID 형식: `[ID: RL-YYYYMMDD-NN]`
  3. 필수 항목: 날짜, 작성자, 변경 유형, 대상 파일, 요약, 상세 설명
  4. 관련 문서에는 ReviseLog 항목 ID만 참조 (내용 중복 금지)
- **적용 범위**: 코드 변경, 문서 수정, 설정 변경, 정책 업데이트 등 모든 변경사항
- **접근성**: 모든 팀원이 ReviseLog.md를 읽고 프로젝트 변경 이력을 파악할 수 있어야 함

---

## 5. 최신/불안점/향후 보강 기록 체계(지속 업데이트 원칙)

- 크롤러/스크래퍼 장애 복구 방법, 수동 실행 예시 추가 필요 : [현재 개선 필요/팀 리뷰 진행중]
- 외국어 번역 품질, 고령자 접근성 실전 테스트 추가 기록 요청됨 : [2025년 11월 테스트 예정]
- 각국 결제/광고/현지화 정책/법률 변경 따라 FAQ·매뉴얼 최신화 완료
- 협업/오픈소스/외부기여자 API 사용법 추가 : 개발팀 문서화 반영(25/11/19)

---

## 6. 실전 FAQ(누구든 바로 따라할 수 있게!)

- 로그인이 잘 안됩니다: 이메일·비번·소셜로그인을 모두 시도, 안될시 FAQ/문의 버튼 클릭!
- 장애복구는 어떻게? 관리자 대시보드 "복구버튼" 누르세요, 자동으로 안내문 표시됨
- 신규 기능 제안/버그 신고: 문의채널 또는 README 내 Issue/변경이력 기록
- 코드 수정할 때: "기능 설명+KST 일시" 주석 반드시 사용, 표준 함수·팀 컨벤션 적용!

---

## 7. 협업/교육/테스트 시나리오와 변경이력/문서화 예시

- 신규 협력자 합류 → README Onboarding 챕터, 세팅/테스트/배포 순서 따라하기
- 기능 추가/변경 → Issue 생성, PR 기록, 변경점·작업자·일시·특이사항 예시 남김
- 장애·취약점/교육 → 교육자료(FAQ/사진/영상), 실전매뉴얼, 개선점 매번 기록·팀 공유
- 항상 최신화! 새로운 문제/오류/기능/정책 생성시 즉시 README 문서+코드+테스트 예시 추가

---

## 9. 자동 코드 리뷰 및 품질 관리 프로토콜

**🚨 필수: 모든 작업 완료 시 자동 코드 리뷰를 의무적으로 실시합니다.**

### 9-1. 자동 검증 체크리스트

**사소한 문제 탐지** (Zero Tolerance):

- [ ] ESLint 경고 0개 (`npm run lint`)
- [ ] TypeScript/JavaScript 컴파일 에러 0개
- [ ] 미사용 변수/import 제거
- [ ] 콘솔 로그 제거 (프로덕션 코드)
- [ ] 주석 처리된 코드 제거
- [ ] TODO/FIXME 주석 처리 (이슈 번호 포함)

**개선 및 고도화 기회**:

- [ ] 성능 병목 분석 (O(n²) 알고리즘, 불필요한 re-render)
- [ ] 접근성(a11y) 개선 (ARIA 속성, 키보드 네비게이션)
- [ ] SEO 최적화 (meta 태그, Open Graph, 구조화된 데이터)
- [ ] 보안 취약점 (XSS, CSRF, SQL Injection 방지)
- [ ] 코드 가독성 (복잡한 로직 단순화, 명확한 변수명)
- [ ] 에러 핸들링 (try-catch, 사용자 친화적 에러 메시지)

**중복 코드 제거**:

- [ ] 동일/유사 로직 3회 이상 반복 → 함수/Hook 추출
- [ ] 공통 유틸리티 함수 통합 (`lib/` 디렉토리)
- [ ] 중복 스타일링 제거 (CSS Modules 활용)
- [ ] 중복 API 호출 최소화 (캐싱 적용)
- [ ] 반복되는 컴포넌트 로직 → Custom Hook 추출

### 9-2. 실행 명령어

**로컬 검증**:

```bash
# 전체 코드 품질 검사
npm run lint          # ESLint (자동 수정: npm run lint -- --fix)
npm test              # Jest 테스트 (커버리지: npm test -- --coverage)
npm run build         # Next.js 빌드 검증
```

**Git Hook 자동 실행**:

```bash
# Husky pre-commit hook (자동 실행)
# - ESLint 검사
# - Prettier 포맷팅
# - Jest 유닛 테스트
git commit -m "feat: add new feature"
```

**CI/CD 자동 실행**:

- GitHub Actions workflow (PR 생성 시)
- Vercel 배포 전 검증

### 9-3. 리뷰 리포트 자동 생성

**생성 문서**:

1. `CODE_IMPROVEMENT_REPORT.md`: 개선 제안 사항 (우선순위별)
2. `CRITICAL_FIX_REPORT.md`: 즉시 수정 필요 사항 (보안, 버그)
3. `ReviseLog.md`: 모든 변경사항 기록

**리포트 구조**:

```markdown
## [날짜] 코드 리뷰 리포트

### 즉시 수정 필요 (Critical)

- [SECURITY] XSS 취약점: `pages/admin/settings.jsx` 라인 45
- [BUG] null 참조 에러: `lib/sanityClient.js` 라인 102

### 개선 제안 (Medium)

- [PERFORMANCE] 불필요한 re-render: `components/CommentList.jsx`
- [DUPLICATE] 중복 API 호출: `pages/api/improve-content.js`

### 리팩토링 기회 (Low)

- [CODE_SMELL] 복잡한 조건문: `utils/contentRestriction.js` 라인 78
- [NAMING] 불명확한 변수명: `x` → `userClickCount`
```

### 9-4. 자동 수정 가능 항목

**즉시 적용 (No Approval)**:

- ESLint --fix로 수정 가능한 포맷팅
- Prettier 코드 스타일 통일
- Unused imports 제거
- 간단한 변수명 수정

**CEO 승인 필요**:

- 로직 변경 (알고리즘 최적화)
- 보안 취약점 수정 (인증/권한 로직)
- 중복 코드 추출 (함수 시그니처 변경)
- 아키텍처 변경 (디렉토리 구조, API 설계)

### 9-5. 적용 대상 및 제외 파일

**적용 대상**:

- `components/**/*.jsx`
- `pages/**/*.jsx`
- `lib/**/*.js`
- `utils/**/*.js`
- `*.module.css`
- `next.config.js`, `vercel.json`
- `README.md`, `WORKGUIDE.md`, `docs/**/*.md`

**제외 파일**:

- `node_modules/`
- `.next/`, `out/`
- `*.min.js`, `*.bundle.js`
- `.env`, `.env.local`

### 9-6. CEO 알림 및 리포트

**즉시 알림 (Critical)**:

- 보안 취약점 발견 시
- 프로덕션 버그 발견 시
- 빌드 실패 시

**주기적 리포트**:

- **주간 코드 품질 리포트** (매주 월요일 09:00 KST)
  - 신규 개선 제안
  - 해결된 이슈
  - 코드 품질 지표 (ESLint 경고 수, 테스트 커버리지)
- **월간 기술 부채 리포트** (매월 1일)
  - 누적된 TODO/FIXME
  - 중복 코드 현황
  - 리팩토링 우선순위

### 9-7. 지속적 개선 프로세스

**학습 및 규칙 추가**:

1. 자주 발생하는 이슈 → ESLint 규칙 추가
2. Best Practice 발견 → 템플릿/스니펫 제공
3. 팀 코딩 컨벤션 업데이트

**문서 자동 업데이트**:

- 모든 리뷰 결과 → `ReviseLog.md` 기록
- 새로운 Best Practice → `WORKGUIDE.md` 추가
- 아키텍처 변경 → `README.md` 반영

**메트릭 추적**:

- ESLint 경고 수 추이
- 테스트 커버리지 변화
- 빌드 시간 변화
- 번들 사이즈 변화

### 9-8. 실전 예시

**Before (개선 전)**:

```javascript
// ❌ 중복 코드, 복잡한 로직, 성능 이슈
function processData(data) {
  let result = []
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      if (data[i].id === data[j].parentId) {
        result.push({ ...data[i], children: data[j] })
      }
    }
  }
  return result
}
```

**After (개선 후)**:

```javascript
// ✅ 최적화, 명확한 로직, O(n) 성능
function processData(data) {
  const parentMap = new Map(data.map(item => [item.id, item]))

  return data
    .filter(item => item.parentId)
    .map(child => ({
      ...parentMap.get(child.parentId),
      children: child,
    }))
}
```

**리포트**:

- 개선 항목: 성능 최적화 (O(n²) → O(n))
- 예상 효과: 1000개 데이터 처리 시간 500ms → 5ms
- 변경 파일: `lib/dataProcessor.js`
- ReviseLog ID: RL-20251120-15

---

## 10. 최종 안내/운영 원칙

- 본 README는 "누구든 바로 따라할 수 있는" 시나리오, FAQ, 코드 예시, 작업 매뉴얼, 변경이력, 장애복구, 협업/교육/테스트 기록까지  
  모든 이해관계자가 직접 활용 가능한 "완전무결, 최신, 실전 중심의 통합 표준 문서"입니다.
- 파일 구조, 코드 작성, 기능명세, 장애복구, 교육, 협업, 정책, 변경·보강 기록은  
  빠짐없이, 누락없이, 항상 최신/실전 기준으로 README에 즉시 기록/반영/공유합니다.
- 불안한 부분, 개선 필요점은 README에 즉시 체크·예시·실제 매뉴얼 기록 후,  
  빠른 예시 코드/복구 워크플로우/FAQ/교육자료 추가하는 식으로  
  지속적 고도화·업데이트 유지
- 반드시 모든 작업·협업·교육·운영·테스트·정책 변경은 본 README 파일을 기준으로 실시하세요!
