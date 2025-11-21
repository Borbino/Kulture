# Sanity Studio 스키마 배포 가이드

## 📋 배포할 스키마 목록

이 프로젝트는 다음 Sanity 스키마들을 사용합니다:

### 기본 스키마
1. **post** - 블로그 게시물
2. **author** - 작성자 정보
3. **category** - 카테고리
4. **siteSettings** - 사이트 설정

### 확장 스키마 (Phase 2에서 추가)
5. **trendTracking** - 트렌드 추적 데이터
6. **trendSnapshot** - 트렌드 스냅샷
7. **vipMonitoring** - VIP 모니터링 데이터
8. **dailyReport** - 일일 리포트
9. **hotIssue** - 핫 이슈
10. **ceoFeedback** - CEO 피드백
11. **performanceReport** - 성능 리포트 (Phase 2)

## 🚀 Sanity Studio 배포 단계

### Step 1: Sanity CLI 설치

```bash
npm install -g @sanity/cli
```

### Step 2: Sanity 프로젝트 확인

```bash
# 현재 프로젝트 ID 확인
cat lib/sanityClient.js | grep projectId

# Sanity 로그인
sanity login
```

### Step 3: 스키마 검증

```bash
# 스키마 오류 확인
sanity schema validate
```

### Step 4: Studio 배포

```bash
# Studio 빌드 및 배포
cd studio  # Studio 디렉토리가 있다면
sanity deploy

# 또는 프로젝트 루트에서
npx sanity deploy
```

배포 후 Studio URL: `https://your-project.sanity.studio`

### Step 5: 스키마 적용 확인

Studio에서 다음 항목들이 표시되는지 확인:

- [x] Post (게시물)
- [x] Author (작성자)
- [x] Category (카테고리)
- [x] Site Settings (사이트 설정)
- [x] Trend Tracking (트렌드 추적)
- [x] Trend Snapshot (트렌드 스냅샷)
- [x] VIP Monitoring (VIP 모니터링)
- [x] Daily Report (일일 리포트)
- [x] Hot Issue (핫 이슈)
- [x] CEO Feedback (CEO 피드백)
- [x] Performance Report (성능 리포트)

## 📝 스키마 상세 정보

### 1. trendTracking (트렌드 추적)
**용도**: 실시간 트렌드 데이터 저장
**필드**:
- keyword (string, 필수)
- source (string: twitter|youtube|reddit|naver)
- mentions (number)
- lastUpdated (datetime)
- trend (string: rising|stable|declining)

### 2. trendSnapshot (트렌드 스냅샷)
**용도**: 시계열 트렌드 분석
**필드**:
- date (datetime)
- trends (array of trendTracking)
- topKeywords (array of strings)

### 3. vipMonitoring (VIP 모니터링)
**용도**: VIP 계정 활동 추적
**필드**:
- vipName (string)
- platform (string)
- latestActivity (text)
- activityCount (number)
- lastChecked (datetime)

### 4. performanceReport (성능 리포트)
**용도**: 시스템 성능 메트릭
**필드**:
- timestamp (datetime)
- apis (array): 각 API의 latency, calls, errors
- caches (array): 캐시 히트율
- system: memory, CPU 사용률

## 🔧 스키마 커스터마이징

### Studio UI 커스터마이징

`sanity.config.js` 또는 스키마 파일에서:

```javascript
export default {
  name: 'trendTracking',
  title: '트렌드 추적',
  type: 'document',
  icon: TrendingUpIcon, // 아이콘 추가
  fieldsets: [
    {
      name: 'metadata',
      title: '메타데이터',
      options: { collapsible: true }
    }
  ],
  preview: {
    select: {
      title: 'keyword',
      subtitle: 'source',
      mentions: 'mentions'
    },
    prepare({ title, subtitle, mentions }) {
      return {
        title,
        subtitle: `${subtitle} - ${mentions} mentions`
      }
    }
  }
}
```

### 권한 설정

Sanity 대시보드에서:
1. Settings → API
2. Tokens → Add API Token
3. 권한 선택:
   - Viewer: 읽기 전용
   - Editor: 읽기/쓰기
   - Admin: 전체 권한

4. 생성된 토큰을 `SANITY_API_TOKEN`으로 저장

## 🧪 테스트 데이터 입력

Studio에서 각 스키마에 테스트 데이터 입력:

### Trend Tracking 샘플
```json
{
  "keyword": "AI 트렌드",
  "source": "twitter",
  "mentions": 1500,
  "trend": "rising",
  "lastUpdated": "2025-11-21T10:00:00Z"
}
```

### VIP Monitoring 샘플
```json
{
  "vipName": "G-Dragon",
  "platform": "instagram",
  "latestActivity": "New post about upcoming album",
  "activityCount": 5,
  "lastChecked": "2025-11-21T10:00:00Z"
}
```

## 📊 데이터 마이그레이션

기존 데이터가 있다면:

```bash
# 데이터 익스포트
sanity dataset export production backup.tar.gz

# 새 스키마 적용 후 데이터 임포트
sanity dataset import backup.tar.gz production
```

## 🔍 문제 해결

### "Schema not found" 에러
→ `lib/schemas/index.js`에서 모든 스키마 export 확인

### Studio에 스키마가 안 보일 때
→ Studio 재배포: `sanity deploy`
→ 브라우저 캐시 삭제

### API 토큰 에러
→ Sanity 대시보드에서 토큰 권한 확인
→ 토큰 재생성 후 환경변수 업데이트

---

**작성일**: 2025-11-21  
**관련 문서**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
