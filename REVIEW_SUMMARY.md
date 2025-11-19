# 변경 요약 및 검토 요청 (RL-20251119-03)

작성일: 2025-11-19 12:40 (KST)
작성자: 시스템(자동)

## 변경 요약

이번 작업에서 아래 파일들을 추가/수정했습니다:

- `AGENT_POLICY.md` (추가): Agent 권한·검토·승인 정책 초안
- `AGENT_USAGE.md` (추가): Agent 운영 가이드 초안(Ask→Plan→Edit→Review)
- `ReviseLog.md` (수정): RL-20251119-02 항목 추가
- `README.md` (수정): ReviseLog 규칙 및 도메인(`kulture.wiki`) 추가
- `WORKGUIDE.md` (수정): ReviseLog 규칙 문구 추가
- `PR_TEMPLATE.md` (추가): PR 템플릿 및 검토 체크리스트
- `.github/workflows/revise_log_check.yml` (추가): PR 제목에 ReviseLog ID 검사 + CI placeholder

## ReviseLog 항목 추가 예정

### [ID: RL-20251119-03]

- 날짜: 2025-11-19 12:40 (KST)
- 작성자: 시스템(자동)
- 변경 유형: 문서
- 변경 대상 파일/경로: `AGENT_POLICY.md`, `AGENT_USAGE.md`, `PR_TEMPLATE.md`, `.github/workflows/revise_log_check.yml`, `REVIEW_SUMMARY.md`
- 변경 요약: Agent 정책·사용 가이드·PR 템플릿 및 CI 검사 워크플로우 추가
- 변경 상세 설명: 프로젝트의 자동화 작업을 안전하게 운영하기 위한 문서와 워크플로우를 추가함. ReviseLog 규칙과 PR 검사 워크플로우를 통해 자동 변경의 투명성 및 CI 보장을 강화함.
- 관련 PR/이슈: (자동 생성 예정)

## 검토 요청(체크리스트)

- [ ] AGENT_POLICY.md 내용(권한 레벨·임계값·ReviseLog 규칙)에 CEO 승인 필요
- [ ] AGENT_USAGE.md의 워크플로우 및 템플릿이 실무에 맞는지 확인
- [ ] `.github/workflows/revise_log_check.yml`의 검사 규칙(정규식)이 조직 표준에 적합한지 확인
- [ ] PR 템플릿 항목이 충분한지 확인(민감파일 처리, 테스트 요구 등)

## 권장 다음 단계

1. CEO 승인(AGENT_POLICY.md) — 승인 시 정책을 최종화합니다.
2. 테스트 PR 생성: 예시 변경을 만들어 워크플로우 트리거 및 CI 동작 확인
3. 필요 시 워크플로우 개선(정규식, CI 단계 세부화)

---

(이 파일은 자동 생성되었습니다.)
