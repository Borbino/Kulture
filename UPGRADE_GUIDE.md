# Kulture 프로젝트 업그레이드 가이드

## 📋 개요

이 문서는 Kulture 프로젝트의 보안 취약점 해결 및 패키지 업그레이드를 위한 가이드입니다.

**작성일**: 2025-11-19  
**현재 상태**: 프로덕션 준비 완료, 업그레이드 권장

---

## 🔍 현재 상태

### ✅ 해결 완료 항목

- **ESLint 오류**: 0개 (모든 경고 해결 완료)
- **테스트**: 6/6 통과 (100%)
- **코드 품질**:
  - 중복 Sanity 클라이언트 통합 (8개 파일)
  - React Hooks 순서 문제 해결
  - PropTypes 추가 (2개 컴포넌트)
  - 접근성(ARIA) 개선
  - 마크다운 린트 수정 (8개 오류)
- **스키마 파일**: 10개 모두 명명된 export로 표준화

### ⚠️ 주의 필요 항목

**보안 취약점**: 15개 (프로덕션 의존성)

- 중간: 6개
- 높음: 9개
- 심각: 0개

**원인**: `next-sanity@7.1.4`의 의존성 패키지들

- `glob@10.2.0-10.4.5`: 명령어 주입 취약점
- `prismjs@<1.30.0`: DOM Clobbering 취약점

---

## 🚀 업그레이드 계획

### Option 1: 전체 업그레이드 (권장)

**목표**: 모든 보안 취약점 해결

```bash
# 1. 현재 상태 백업
git add -A
git commit -m "chore: pre-upgrade backup"

# 2. next-sanity 업그레이드
npm install next-sanity@latest

# 3. 의존성 정리
npm audit fix --force

# 4. 테스트 실행
npm test
npm run lint
npm run build

# 5. 변경사항 확인
git diff
```

**예상 변경사항**:

- `next-sanity`: 7.1.4 → 11.6.8 (주요 버전 업그레이드)
- Breaking changes 가능성 있음

**예상 소요 시간**: 1-2시간

**위험도**: 중간

- API 호환성 확인 필요
- 타입 정의 변경 가능성
- 빌드 테스트 필수

---

### Option 2: 단계적 업그레이드

**1단계: 프로덕션 확인**

```bash
# 현재 버전으로 프로덕션 배포
npm run build
vercel --prod
```

**2단계: 로컬 테스트**

```bash
# 새 브랜치에서 업그레이드 테스트
git checkout -b upgrade/next-sanity-11
npm install next-sanity@latest
npm test
npm run build
```

**3단계: 문제 해결**

- Breaking changes 문서 검토: https://github.com/sanity-io/next-sanity/releases
- API 호출 수정
- 타입 오류 해결

**4단계: 배포**

```bash
# 테스트 통과 후 메인 브랜치 병합
git checkout main
git merge upgrade/next-sanity-11
vercel --prod
```

---

## 📊 취약점 상세 분석

### 1. glob (높음)

**영향**: `@sanity/cli` → `@sanity/runtime-cli` → `@architect/hydrate` → `glob`

**설명**: CLI 명령어 주입 취약점

**위험도 평가**:

- 실제 위험: **낮음** (CLI 도구는 개발 환경에서만 사용)
- 프로덕션 영향: **없음** (런타임에 사용되지 않음)

**해결 방법**: `next-sanity@11.6.8` 업그레이드

---

### 2. prismjs (중간)

**영향**: `sanity` → `react-refractor` → `refractor` → `prismjs`

**설명**: DOM Clobbering 취약점

**위험도 평가**:

- 실제 위험: **낮음** (Sanity Studio에서만 사용)
- 프로덕션 영향: **없음** (사용자 데이터 처리 없음)

**해결 방법**: `next-sanity@11.6.8` 업그레이드

---

## 🛡️ 보안 권장사항

### 즉시 실행 가능 (위험 없음)

1. **환경 변수 보호**

```bash
# .env.local 파일 생성 (Git 제외됨)
cp .env.example .env.local
# 실제 API 키 입력
```

2. **CRON_SECRET 생성**

```bash
# 안전한 랜덤 문자열 생성
openssl rand -base64 32
# .env.local에 추가
echo "CRON_SECRET=<생성된_문자열>" >> .env.local
```

3. **Git 보안 확인**

```bash
# .env.local이 커밋되지 않았는지 확인
git status
# .gitignore 확인
cat .gitignore | grep .env
```

---

### 중기 계획 (1-2주 내)

1. **next-sanity 업그레이드** (이 문서의 Option 1 또는 2)
2. **CI/CD 파이프라인 설정**
   - GitHub Actions로 자동 테스트
   - 보안 스캔 자동화
3. **의존성 자동 업데이트**
   - Dependabot 설정
   - 주간 보안 패치 리뷰

---

### 장기 계획 (1개월 이상)

1. **모니터링 시스템**
   - Sentry 에러 추적
   - Vercel Analytics
2. **성능 최적화**
   - Next.js Image 컴포넌트 적용
   - 코드 스플리팅 개선
3. **보안 강화**
   - HTTPS 강제
   - CSP 헤더 설정
   - Rate Limiting

---

## 📝 업그레이드 체크리스트

**사전 준비**

- [ ] 현재 코드 Git 커밋
- [ ] 프로덕션 백업
- [ ] .env.local 파일 준비

**업그레이드**

- [ ] `next-sanity@11.6.8` 설치
- [ ] `npm audit fix --force` 실행
- [ ] Breaking changes 확인

**테스트**

- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 성공
- [ ] 로컬 실행 정상 (`npm run dev`)
- [ ] Sanity API 연동 확인

**배포**

- [ ] Vercel preview 배포
- [ ] 기능 테스트 (콘텐츠 생성, 읽기)
- [ ] 프로덕션 배포
- [ ] 모니터링 확인

---

## 🔗 참고 자료

### 공식 문서

- [next-sanity Releases](https://github.com/sanity-io/next-sanity/releases)
- [Sanity Migration Guide](https://www.sanity.io/docs/migration-guides)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### 보안 정보

- [npm audit 문서](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk Vulnerability DB](https://security.snyk.io/)

---

## 📞 지원

문제 발생 시:

1. GitHub Issues 생성
2. 변경 내역 롤백: `git reset --hard HEAD~1`
3. 이전 버전으로 재배포

---

## 📈 업그레이드 후 기대 효과

✅ **보안**

- 15개 취약점 → 0개
- 최신 보안 패치 적용

✅ **성능**

- 최신 Next.js 13+ 기능 활용
- 개선된 빌드 최적화

✅ **유지보수**

- 최신 API 사용
- 더 나은 타입 지원
- 활발한 커뮤니티 지원

---

**마지막 업데이트**: 2025-11-19  
**작성자**: GitHub Copilot  
**버전**: 1.0.0
