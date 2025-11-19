# 환경변수 및 시크릿 관리 가이드

## 목적
프로젝트의 민감정보(API 키, 토큰, DB 접속 정보 등)를 안전하게 관리하기 위한 가이드입니다.

## 기본 원칙
- 절대 금지: `.env` 파일을 Git에 커밋하지 않습니다.
- 필수: `.env.example`에 필요한 환경변수 목록을 기록합니다.
- 권장: 로컬 개발은 `.env.local`, 프로덕션은 Vercel/GitHub Secrets 사용.

## 환경변수 파일
- `.env.example`: 필요한 환경변수 목록(값 제외)
- `.env.local`: 로컬 개발용(Git에서 제외됨)
- `.env`: 일반적으로 사용하지 않음(로컬 테스트용)

## 설정 방법
1. `.env.example`을 복사하여 `.env.local` 생성
2. 실제 값을 채워넣기
3. Next.js 서버 재시작

## Vercel 배포 시
1. Vercel 대시보드 → Settings → Environment Variables
2. 각 환경변수를 입력(Production/Preview/Development 선택)
3. 자동으로 빌드 시 주입됨

## 주의사항
- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트에 노출됩니다.
- 민감한 정보(API 토큰 등)는 절대 `NEXT_PUBLIC_` 사용 금지.
- 유출 시 즉시 키/토큰 재발급 및 ReviseLog 기록.

## 감사 로그
- 환경변수 변경 시 ReviseLog에 변경 이력 기록(값 제외).
