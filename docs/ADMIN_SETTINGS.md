# 관리자 설정 시스템

**[일시]** 2025-11-19 14:00 (KST)  
**[작성자]** GitHub Copilot Agent  
**[목적]** CEO가 모든 기능을 직접 제어할 수 있는 관리자 페이지 가이드

---

## 📋 목차

1. [개요](#개요)
2. [관리자 페이지 접속](#관리자-페이지-접속)
3. [설정 항목 상세](#설정-항목-상세)
4. [기술 구조](#기술-구조)
5. [확장 가이드](#확장-가이드)

---

## 개요

Kulture 관리자 설정 시스템은 CEO가 코드 수정 없이 **모든 기능을 실시간으로 On/Off하거나 조정**할 수 있도록 설계되었습니다.

### 핵심 특징

- ✅ **코드 수정 불필요**: 관리자 페이지에서 클릭만으로 설정 변경
- ✅ **실시간 적용**: 설정 저장 즉시 사이트 전체 반영
- ✅ **Sanity CMS 연동**: 모든 설정은 Sanity Studio에서도 관리 가능
- ✅ **비율 조정**: 슬라이더로 10~100% 사이 세밀한 조정
- ✅ **미래 확장성**: 신규 기능도 동일한 패턴으로 추가 가능

---

## 관리자 페이지 접속

### 1. URL 접속

```
https://kulture.wiki/admin/settings
```

### 2. 비밀번호 인증

- 기본 비밀번호: `kulture2025`
- 환경변수로 변경 가능: `NEXT_PUBLIC_ADMIN_PASSWORD`

**비밀번호 변경 방법:**
```bash
# Vercel 환경변수 설정
NEXT_PUBLIC_ADMIN_PASSWORD=새로운비밀번호
```

### 3. 보안 권장사항

⚠️ **프로덕션 환경에서는 반드시 비밀번호를 변경하세요!**

향후 더 강력한 인증 시스템 (OAuth, JWT 등)으로 업그레이드를 권장합니다.

---

## 설정 항목 상세

### 📄 콘텐츠 제한 (Content Restriction)

비회원이 볼 수 있는 콘텐츠의 양을 제어합니다.

#### 설정 항목

| 항목 | 타입 | 범위 | 기본값 | 설명 |
|------|------|------|--------|------|
| **기능 활성화** | 토글 | On/Off | On | 콘텐츠 제한 전체 기능 활성화 |
| **비회원 노출 비율** | 슬라이더 | 10~100% | 40% | 비회원에게 보여줄 콘텐츠 비율 |
| **본문 텍스트 적용** | 체크박스 | On/Off | On | 게시물 본문에 제한 적용 |
| **댓글 적용** | 체크박스 | On/Off | On | 댓글에 제한 적용 |
| **이미지 적용** | 체크박스 | On/Off | On | 이미지에 제한 적용 |
| **무료 이미지 개수** | 숫자 | 0~10 | 2 | 제한 없이 볼 수 있는 이미지 수 |

#### 사용 예시

**시나리오 1: 전체 공개 이벤트**
- 기능 활성화: Off → 모든 콘텐츠 제한 없이 공개

**시나리오 2: 부분 개방 전략**
- 비회원 노출 비율: 70% → 더 많은 콘텐츠 미리보기 허용

**시나리오 3: 댓글만 제한**
- 본문 텍스트 적용: Off
- 댓글 적용: On → 본문은 전체 공개, 댓글만 제한

---

### 📺 광고 시청 기능 (Ad Watch Feature)

광고 시청으로 콘텐츠 잠금을 해제할 수 있습니다.

#### 설정 항목

| 항목 | 타입 | 범위 | 기본값 | 설명 |
|------|------|------|--------|------|
| **기능 활성화** | 토글 | On/Off | On | 광고 시청 기능 전체 활성화 |
| **광고 최소 시청 시간** | 슬라이더 | 5~120초 | 30초 | 광고를 봐야 하는 최소 시간 |
| **세션 유효 시간** | 슬라이더 | 10~1440분 | 60분 | 광고 시청 후 콘텐츠 접근 가능 시간 |
| **AdSense Client ID** | 텍스트 | - | ca-pub-xxx | Google AdSense 클라이언트 ID |
| **옵션으로 제시** | 체크박스 | On/Off | On | 로그인과 함께 선택지로 제공 |

#### 사용 예시

**시나리오 1: 빠른 수익 테스트**
- 광고 최소 시청 시간: 5초
- 세션 유효 시간: 10분
- → 짧은 광고로 빠른 전환 테스트

**시나리오 2: 프리미엄 전략**
- 옵션으로 제시: Off
- → 광고만 표시하고 회원가입 옵션 숨김

**시나리오 3: 수익 최적화**
- 광고 최소 시청 시간: 60초
- 세션 유효 시간: 180분
- → 높은 광고 수익, 긴 세션

---

### 💬 댓글 (Comments)

#### 설정 항목

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| **댓글 기능 활성화** | 토글 | On | 댓글 전체 기능 활성화 |
| **로그인 필수** | 체크박스 | On | 댓글 작성에 로그인 필요 |
| **승인 시스템** | 체크박스 | Off | 관리자 승인 후 댓글 표시 |

---

### 🔐 회원 인증 (Authentication)

#### 설정 항목

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| **신규 회원가입 허용** | 체크박스 | On | 새로운 사용자 회원가입 허용 |
| **이메일 인증 필수** | 체크박스 | Off | 회원가입 시 이메일 인증 요구 |
| **소셜 로그인** | 체크박스 | Off | Google, Naver, Kakao 로그인 |

---

### ⚙️ 일반 설정 (General)

#### 설정 항목

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| **사이트 이름** | 텍스트 | Kulture | 사이트 제목 |
| **점검 모드** | 토글 | Off | 사이트 전체 점검 페이지 표시 |
| **점검 메시지** | 텍스트 영역 | - | 점검 중 표시할 메시지 |

---

## 기술 구조

### 시스템 아키텍처

```
┌─────────────────┐
│  관리자 페이지   │ (/admin/settings)
│  (CEO 접속)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  lib/settings   │ (설정 관리 로직)
│  - getSiteSettings()
│  - updateSiteSettings()
│  - useSiteSettings Hook
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Sanity CMS     │ (siteSettings 문서)
│  - contentRestriction
│  - adWatchFeature
│  - comments
│  - authentication
│  - general
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  프론트엔드      │
│  컴포넌트들      │
│  - ContentBlur
│  - CommentList
│  - 기타 기능들...
└─────────────────┘
```

### 데이터 흐름

1. **CEO**: 관리자 페이지에서 설정 변경
2. **저장**: `updateSiteSettings()` → Sanity CMS에 저장
3. **조회**: 각 컴포넌트가 `useSiteSettings()` Hook으로 설정 조회
4. **적용**: 설정값에 따라 기능 활성화/비활성화 및 비율 조정

### 코드 예시

#### 기존 기능에 설정 적용하기

```jsx
// components/MyFeature.jsx
import { useSiteSettings } from '@/lib/settings'

export default function MyFeature() {
  const { settings, loading } = useSiteSettings()
  
  // 관리자 설정에서 값 가져오기
  const featureEnabled = settings.myFeature?.enabled ?? true
  const featureValue = settings.myFeature?.value ?? 50
  
  // 기능이 비활성화되어 있으면 숨김
  if (!featureEnabled) {
    return null
  }
  
  // 설정값 적용
  return (
    <div style={{ opacity: featureValue / 100 }}>
      내 기능 내용
    </div>
  )
}
```

---

## 확장 가이드

### 신규 기능 추가 시 체크리스트

앞으로 모든 신규 기능은 이 패턴을 따라 관리자 설정에 추가하세요.

#### 1단계: Sanity 스키마 확장

`lib/schemas/siteSettings.js`에 필드 추가:

```javascript
{
  name: 'newFeature',
  title: '🎯 New Feature',
  type: 'object',
  fields: [
    {
      name: 'enabled',
      title: 'Enable New Feature',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'intensity',
      title: 'Feature Intensity (%)',
      type: 'number',
      validation: Rule => Rule.min(0).max(100),
      initialValue: 50,
    },
  ],
},
```

#### 2단계: 기본값 추가

`lib/settings.js`의 `DEFAULT_SETTINGS`에 추가:

```javascript
export const DEFAULT_SETTINGS = {
  // ... 기존 설정들
  newFeature: {
    enabled: true,
    intensity: 50,
  },
}
```

#### 3단계: 관리자 UI 추가

`pages/admin/settings.jsx`에 섹션 추가:

```jsx
<section className={styles.section}>
  <h2>🎯 New Feature</h2>
  
  <div className={styles.field}>
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={formData.newFeature.enabled}
        onChange={(e) =>
          handleChange('newFeature', 'enabled', e.target.checked)
        }
      />
      <span className={styles.toggleSlider}></span>
      <span className={styles.toggleLabel}>기능 활성화</span>
    </label>
  </div>
  
  <div className={styles.field}>
    <label>
      강도: {formData.newFeature.intensity}%
    </label>
    <input
      type="range"
      min="0"
      max="100"
      value={formData.newFeature.intensity}
      onChange={(e) =>
        handleChange('newFeature', 'intensity', parseInt(e.target.value))
      }
      className={styles.slider}
    />
  </div>
</section>
```

#### 4단계: 컴포넌트에 적용

```jsx
import { useSiteSettings } from '@/lib/settings'

export default function MyNewFeature() {
  const { settings, loading } = useSiteSettings()
  const enabled = settings.newFeature?.enabled ?? true
  const intensity = settings.newFeature?.intensity ?? 50
  
  if (!enabled) return null
  
  return <div>내 신규 기능 (강도: {intensity}%)</div>
}
```

---

## 환경변수 설정

### `.env.local` 파일

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production

# 관리자 인증
NEXT_PUBLIC_ADMIN_PASSWORD=kulture2025

# Google AdSense (관리자 페이지에서 설정 가능)
# NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
```

---

## FAQ

### Q1: 설정 변경이 즉시 반영되지 않아요

**A**: 브라우저 캐시를 지우고 새로고침하세요. Sanity CMS CDN 캐시는 최대 1분 정도 걸릴 수 있습니다.

### Q2: 관리자 페이지에 접속할 수 없어요

**A**: 다음을 확인하세요:
1. URL이 정확한지 (`/admin/settings`)
2. 비밀번호가 맞는지
3. 환경변수 `NEXT_PUBLIC_ADMIN_PASSWORD`가 설정되었는지

### Q3: 설정을 잘못 바꿨어요. 원래대로 돌릴 수 있나요?

**A**: 
- **방법 1**: 관리자 페이지에서 다시 수정
- **방법 2**: Sanity Studio에서 이전 버전 복원 (History 기능)
- **방법 3**: 코드의 `DEFAULT_SETTINGS`로 복원 (Sanity 문서 삭제)

### Q4: Sanity와 관리자 페이지 중 어디서 설정하나요?

**A**: 
- **관리자 페이지** (`/admin/settings`): CEO가 직관적으로 조작하기 좋음
- **Sanity Studio**: 개발자가 세밀한 설정을 할 때 유용

둘 다 동일한 데이터를 수정하므로 선호하는 곳에서 사용하세요.

---

## 참고 문서

- [Sanity CMS 스키마 가이드](/lib/schemas/siteSettings.js)
- [설정 관리 API 문서](/lib/settings.js)
- [환경변수 가이드](/docs/ENVIRONMENT_VARIABLES.md)
- [ReviseLog 항목: RL-20251119-06](/ReviseLog.md)

---

**[최종 수정]** 2025-11-19 14:00 (KST)  
**[ReviseLog]** RL-20251119-06
