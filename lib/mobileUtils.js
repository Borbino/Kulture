/**
 * mobileUtils — 플랫폼 감지 + 모바일 네이티브 기능 유틸리티
 * [목적] Capacitor/PWA 환경에서 플랫폼별 네이티브 기능 추상화
 *        웹 브라우저, PWA (홈 화면 추가), Capacitor iOS/Android 모두 지원
 */

// ──────────────────────────────────────────────
// 플랫폼 감지
// ──────────────────────────────────────────────

/**
 * Capacitor를 통해 실행 중인지 확인 (iOS 앱 / Android 앱)
 */
export function isNativeApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/**
 * 현재 플랫폼 반환
 * @returns {'ios' | 'android' | 'web' | 'pwa'}
 */
export function getPlatform() {
  if (typeof window === 'undefined') return 'web';

  // Capacitor native
  if (window.Capacitor?.isNativePlatform?.()) {
    return window.Capacitor.getPlatform?.() || 'web';
  }

  // PWA: 홈 화면 추가 후 standalone 모드
  if (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  ) {
    return 'pwa';
  }

  return 'web';
}

/**
 * iOS 장치 여부 (Safari 포함 브라우저)
 */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Android 장치 여부
 */
export function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * 모바일 기기 여부 (iOS + Android)
 */
export function isMobile() {
  return isIOS() || isAndroid();
}

// ──────────────────────────────────────────────
// 푸시 알림
// ──────────────────────────────────────────────

/**
 * 푸시 알림 권한 요청 및 등록
 * @returns {Promise<{granted: boolean, token?: string}>}
 */
export async function requestPushPermission() {
  // Capacitor 네이티브 앱
  if (isNativeApp()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        return { granted: true };
      }
      return { granted: false };
    } catch {
      return { granted: false };
    }
  }

  // PWA: Web Push API
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
        return { granted: true, subscription };
      } catch {
        return { granted: true };
      }
    }
    return { granted: false };
  }

  return { granted: false };
}

/**
 * 로컬 알림 표시 (앱 내 배지 등)
 */
export async function showLocalNotification({ title, body, data = {} }) {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            extra: data,
            iconColor: '#667eea',
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }

  // PWA fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, data });
    return true;
  }

  return false;
}

// ──────────────────────────────────────────────
// 앱스토어 리뷰 요청
// ──────────────────────────────────────────────

/**
 * 인앱 스토어 리뷰 다이얼로그 표시
 * 네이티브 앱+조건 충족 시에만 표시 (무분별한 호출 금지)
 */
export async function requestAppReview() {
  if (!isNativeApp()) return false;

  try {
    const { RateApp } = await import('@capacitor-community/rate-app');
    await RateApp.requestReview();
    return true;
  } catch {
    // 패키지 미설치 or 지원 안 하는 경우
    return false;
  }
}

// ──────────────────────────────────────────────
// 공유 (Share API)
// ──────────────────────────────────────────────

/**
 * 네이티브 공유 다이얼로그 (Capacitor Share Plugin / Web Share API)
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.text
 * @param {string} opts.url
 */
export async function shareContent({ title, text, url }) {
  if (isNativeApp()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url, dialogTitle: 'Kulture에서 공유' });
      return true;
    } catch {
      return false;
    }
  }

  // Web Share API (모바일 Chrome / Safari)
  if ('share' in navigator) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }

  // fallback: clipboard
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Safe Area 인셋 값 (노치 / 홈 인디케이터 대응)
// ──────────────────────────────────────────────

/**
 * CSS 환경 변수로 safe-area-inset 값 가져오기
 * @returns {{ top: number, bottom: number, left: number, right: number }}
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  const style = getComputedStyle(document.documentElement);
  const parse = (key) => parseInt(style.getPropertyValue(key) || '0', 10);
  return {
    top: parse('--sat') || 0,
    bottom: parse('--sab') || 0,
    left: parse('--sal') || 0,
    right: parse('--sar') || 0,
  };
}

// ──────────────────────────────────────────────
// 햅틱 피드백
// ──────────────────────────────────────────────

/**
 * 가벼운 햅틱 피드백 (버튼 탭 등)
 * @param {'light'|'medium'|'heavy'} style
 */
export async function haptic(style = 'light') {
  if (isNativeApp()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: map[style] || ImpactStyle.Light });
    } catch {
      // 무시
    }
    return;
  }
  // Web: Vibration API fallback
  if ('vibrate' in navigator) {
    const durationMap = { light: 10, medium: 20, heavy: 40 };
    navigator.vibrate(durationMap[style] || 10);
  }
}

// ──────────────────────────────────────────────
// PWA 설치 프롬프트
// ──────────────────────────────────────────────

let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

/**
 * PWA 홈 화면 추가 프롬프트 표시
 * @returns {Promise<boolean>} 사용자가 수락했는지 여부
 */
export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

/**
 * PWA 설치 가능 여부
 */
export function canInstall() {
  return Boolean(deferredPrompt);
}
