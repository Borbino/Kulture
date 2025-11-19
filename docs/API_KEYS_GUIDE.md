# Kulture 환경 변수 가이드 (100% 무료 플랜)

## 필수 환경 변수

### Sanity.io
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token
```

### 관리자 인증
```bash
NEXT_PUBLIC_ADMIN_PASSWORD=kulture2025
```

### Vercel Cron Jobs
```bash
CRON_SECRET=your_random_secret_key_here
```

### AI 콘텐츠 생성 (Hugging Face - 100% 무료)
```bash
HUGGINGFACE_API_TOKEN=hf_your_token_here
# Hugging Face는 완전 무료, 제한 없음
# 모델: microsoft/phi-2 (2.7B 파라미터, GPT-3.5 수준)
```

## VIP 모니터링 API 키

### 소셜 미디어 (무료)
```bash
# Twitter API v2 (무료)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# YouTube Data API v3 (무료)
YOUTUBE_API_KEY=your_youtube_api_key

# Instagram Basic Display API (무료)
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

### 한국 플랫폼 (무료)
```bash
# Naver DataLab (무료)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Kakao Developers (무료)
KAKAO_REST_API_KEY=your_kakao_key
```

### 트렌드 감지 (무료)
```bash
# Reddit API (무료)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
```

## API 키 취득 가이드

### 1. Hugging Face API (100% 무료, 최우선)
1. [Hugging Face](https://huggingface.co/) 가입
2. Settings → Access Tokens → New token 생성
3. Token 복사 → `HUGGINGFACE_API_TOKEN`에 추가
4. **완전 무료**: 제한 없음, 비용 0원
5. **사용 모델**: microsoft/phi-2 (2.7B, GPT-3.5 수준)
6. **용도**: 기사 자동 생성, 콘텐츠 개선

### 2. Twitter API (무료)
1. [Twitter Developer Portal](https://developer.twitter.com/) 접속
2. "Projects & Apps" → "Create App" 클릭
3. App 정보 입력 (Kulture VIP Monitoring)
4. Bearer Token 복사 → `TWITTER_BEARER_TOKEN`에 추가
5. 무료 플랜: 월 50만 트윗 조회 가능

### 3. YouTube Data API (무료)
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 (Kulture)
3. "API 및 서비스" → "라이브러리" → "YouTube Data API v3" 활성화
4. "사용자 인증 정보" → "API 키 만들기"
5. API 키 복사 → `YOUTUBE_API_KEY`에 추가
6. 무료 플랜: 일 10,000 쿼터 (1 검색 = 100 쿼터 = 100회/일)

### 4. Naver DataLab (무료)
1. [Naver Developers](https://developers.naver.com/) 접속
2. "애플리케이션 등록" 클릭
3. DataLab API 선택
4. Client ID & Secret 복사
5. 무료 플랜: 일 25,000회 호출

### 5. Reddit API (무료)
1. [Reddit Apps](https://www.reddit.com/prefs/apps) 접속
2. "create application" → "script" 선택
3. Client ID & Secret 복사
4. 무료: 분당 60회 요청

## Vercel 배포 설정

### 1. Environment Variables
Vercel 대시보드 → Settings → Environment Variables에 위 변수 추가

### 2. Cron Secret 생성
```bash
# 안전한 랜덤 문자열 생성
openssl rand -base64 32
```
생성된 문자열을 `CRON_SECRET`으로 사용

### 3. Cron Jobs 활성화
- vercel.json 파일이 프로젝트 루트에 있으면 자동 활성화
- 무료 플랜: Hobby ($0/월) - Cron 지원
- Pro 플랜: $20/월 - 더 많은 실행 시간

## 💰 100% 무료 운영 전략

### 완전 무료 설정 (월 $0)
```bash
# AI 생성: Hugging Face (무료, 무제한)
HUGGINGFACE_API_TOKEN=hf_your_token

# 모니터링: 무료 API만 사용
TWITTER_BEARER_TOKEN=...  # 월 50만 조회
YOUTUBE_API_KEY=...       # 일 100회 검색
REDDIT_CLIENT_ID=...      # 무제한
NAVER_CLIENT_ID=...       # 일 25,000회
```

### 무료 플랜의 장점
✅ **Hugging Face**: 완전 무료, 제한 없음, GPT-3.5 수준 품질
✅ **Twitter**: 월 50만 조회 무료
✅ **YouTube**: 일 100회 검색 무료
✅ **Reddit**: 완전 무료
✅ **Naver**: 일 25,000회 무료
✅ **Vercel Hobby**: 무료 호스팅 + Cron Jobs

### 비용 비교
| 항목 | 유료 (OpenAI) | 무료 (Hugging Face) |
|------|---------------|---------------------|
| AI 모델 | GPT-4 ($0.03/1K tokens) | microsoft/phi-2 (무료) |
| 월 비용 | ~$30-40 | **$0** |
| 품질 | 최고 | 우수 (GPT-3.5 수준) |
| 제한 | 비용 한도 | 없음 |

## 문제 해결

### Cron Job이 실행되지 않을 때
1. Vercel 대시보드 → Logs 확인
2. CRON_SECRET 환경 변수 확인
3. Authorization 헤더 확인

### API Rate Limit 초과 시
1. 모니터링 주기 조정 (5분 → 15분)
2. VIP Tier 2를 daily로 변경
3. 무료 플랜에서 유료 플랜으로 업그레이드 (필요시)

### Hugging Face API 느릴 때
1. 모델 워밍업 대기 (첫 요청 시 20-30초)
2. Fallback 템플릿 자동 적용
3. 여러 요청 병렬 처리 금지 (순차 처리)

### CEO 피드백 학습
1. ceoFeedback 스키마에 자동 저장
2. 50개 최근 피드백 분석
3. 키워드 빈도 기반 학습
4. 다음 AI 생성 시 자동 반영

## 🎉 무료 운영 성과

- ✅ AI 콘텐츠 생성: 100% 무료 (Hugging Face)
- ✅ VIP 모니터링: 100% 무료 (Twitter, YouTube, Reddit 등)
- ✅ 트렌드 감지: 100% 무료 (Google Trends, Naver DataLab)
- ✅ 호스팅: 무료 (Vercel Hobby)
- ✅ CMS: 무료 (Sanity 무료 플랜)

**총 월 비용: $0** 🎊

## VIP 모니터링 API 키

### 소셜 미디어 (필수)
```bash
# Twitter API v2
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# Instagram Basic Display API
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

### 한국 플랫폼 (권장)
```bash
# Naver DataLab
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Kakao Developers
KAKAO_REST_API_KEY=your_kakao_key
```

### 트렌드 감지 (선택)
```bash
# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret

# TikTok API (선택)
TIKTOK_CLIENT_KEY=your_tiktok_key
```

## API 키 취득 가이드

### 1. Twitter API
1. [Twitter Developer Portal](https://developer.twitter.com/) 접속
2. "Projects & Apps" → "Create App" 클릭
3. App 정보 입력 (Kulture VIP Monitoring)
4. Bearer Token 복사 → `TWITTER_BEARER_TOKEN`에 추가
5. 무료 플랜: 월 50만 트윗 조회 가능

### 2. YouTube Data API
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 (Kulture)
3. "API 및 서비스" → "라이브러리" → "YouTube Data API v3" 활성화
4. "사용자 인증 정보" → "API 키 만들기"
5. API 키 복사 → `YOUTUBE_API_KEY`에 추가
6. 무료 플랜: 일 10,000 쿼터 (1 검색 = 100 쿼터 = 100회/일)

### 3. OpenAI API
1. [OpenAI Platform](https://platform.openai.com/) 접속
2. "API keys" → "Create new secret key" 클릭
3. API 키 복사 → `OPENAI_API_KEY`에 추가
4. 비용: GPT-4 $0.03/1K tokens, DALL-E 3 $0.04/image

### 4. Naver DataLab
1. [Naver Developers](https://developers.naver.com/) 접속
2. "애플리케이션 등록" 클릭
3. DataLab API 선택
4. Client ID & Secret 복사
5. 무료 플랜: 일 25,000회 호출

### 5. Reddit API
1. [Reddit Apps](https://www.reddit.com/prefs/apps) 접속
2. "create application" → "script" 선택
3. Client ID & Secret 복사
4. 무료 플랫 분 60회 요청

## Vercel 배포 설정

### 1. Environment Variables
Vercel 대시보드 → Settings → Environment Variables에 위 변수 추가

### 2. Cron Secret 생성
```bash
# 안전한 랜덤 문자열 생성
openssl rand -base64 32
```
생성된 문자열을 `CRON_SECRET`으로 사용

### 3. Cron Jobs 활성화
- vercel.json 파일이 프로젝트 루트에 있으면 자동 활성화
- 무료 플랜: Hobby ($0/월) - Cron 지원
- Pro 플랜: $20/월 - 더 많은 실행 시간

## 비용 최적화

### 무료로 운영 가능한 설정
```bash
# AI 이미지 생성 비활성화 (비용 절감)
ENABLE_IMAGE_GENERATION=false

# GPT-3.5-turbo 사용 (GPT-4보다 저렴)
OPENAI_MODEL=gpt-3.5-turbo

# 무료 API만 사용
# ✅ Twitter: 월 50만 조회
# ✅ YouTube: 일 100회 검색
# ✅ Reddit: 무제한
# ✅ Naver: 일 25,000회
```

### 예상 월 비용 (GPT-4 + DALL-E 사용 시)
- GPT-4 기사 생성: 하루 3회 × 30일 × $0.30 = ~$27/월
- DALL-E 이미지: 하루 3개 × 30일 × $0.04 = ~$3.6/월
- **총: 약 $30-40/월**

### 비용 절감 옵션 (GPT-3.5-turbo만)
- GPT-3.5-turbo: 하루 3회 × 30일 × $0.02 = ~$1.8/월
- 이미지 생성 비활성화: $0
- **총: 약 $2/월**

## 문제 해결

### Cron Job이 실행되지 않을 때
1. Vercel 대시보드 → Logs 확인
2. CRON_SECRET 환경 변수 확인
3. Authorization 헤더 확인

### API Rate Limit 초과 시
1. 모니터링 주기 조정 (5분 → 15분)
2. VIP Tier 2를 daily로 변경
3. 무료 플랜에서 유료 플랜으로 업그레이드

### OpenAI 비용 초과 방지
1. Vercel Environment Variables에 `OPENAI_SPENDING_LIMIT` 설정
2. OpenAI 대시보드에서 월 사용 한도 설정
3. GPT-3.5-turbo로 변경
