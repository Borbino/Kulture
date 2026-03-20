/**
 * AdPlacement — Phase 10 · 동적 A/B 광고 배치 컴포넌트
 *
 * - abTestingEngine과 연동하여 Variant별 디자인이 자동 변경
 * - 클릭/체류시간 이벤트를 실시간으로 A/B 엔진에 로깅
 * - 구글 애드센스 또는 모의 배너 모두 지원 (slot prop)
 * - 반응형: 모바일 300×250, 태블릿 468×60, 데스크톱 728×90 / 970×250
 */
import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { assignVariant, trackImpression, trackClick, trackDwell } from '../lib/abTestingEngine.js';
import styles from './AdPlacement.module.css';

// 서버리스 환경에서 고유 ID 생성 (쿠키 또는 sessionStorage 기반)
function getUserId() {
  if (typeof window === 'undefined') return 'ssr-user';
  let uid = sessionStorage.getItem('_kulture_uid');
  if (!uid) {
    uid = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('_kulture_uid', uid);
  }
  return uid;
}

/**
 * @param {object}  props
 * @param {'feed'|'article'|'sidebar'} props.placement - 광고 위치 유형
 * @param {string}  [props.adSlot]       - 구글 애드센스 data-ad-slot 값 (없으면 모의 배너)
 * @param {string}  [props.adClient]     - 구글 애드센스 data-ad-client 값
 * @param {string}  [props.className]    - 추가 className
 */
export default function AdPlacement({ placement = 'feed', adSlot, adClient, className = '' }) {
  const userId    = typeof window !== 'undefined' ? getUserId() : 'ssr-user';
  const { variantId } = assignVariant(userId, 'ad_placement');
  const { variantId: glowVariant } = assignVariant(userId, 'ad_glow');

  const containerRef = useRef(null);
  const impressedRef = useRef(false);
  const enterTimeRef = useRef(null);

  // ── Impression 추적 (IntersectionObserver) ──────────────────────────
  useEffect(() => {
    if (impressedRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressedRef.current) {
          impressedRef.current = true;
          enterTimeRef.current = Date.now();
          trackImpression(userId, 'ad_placement', variantId);
          trackImpression(userId, 'ad_glow', glowVariant);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [userId, variantId, glowVariant]);

  // ── 페이지 이탈 시 Dwell Time 기록 ─────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (enterTimeRef.current) {
        const dwellMs = Date.now() - enterTimeRef.current;
        trackDwell(userId, 'ad_placement', variantId, dwellMs);
      }
    };
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, [userId, variantId]);

  // ── Click 추적 ─────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    trackClick(userId, 'ad_placement', variantId);
    trackClick(userId, 'ad_glow', glowVariant);
  }, [userId, variantId, glowVariant]);

  // ── Variant별 스타일 클래스 결정 ───────────────────────────────────
  const glowClass =
    glowVariant === 'B' ? styles.glowSoft :
    glowVariant === 'C' ? styles.glowStrong :
    '';

  // placement에 따른 사이즈 클래스
  const sizeClass =
    placement === 'article'  ? styles.sizeArticle  :
    placement === 'sidebar'  ? styles.sizeSidebar  :
    styles.sizeFeed;

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${sizeClass} ${glowClass} ${className}`}
      data-variant={variantId}
      data-placement={placement}
      onClick={handleClick}
      role="complementary"
      aria-label="Advertisement"
    >
      {/* 광고 레이블 */}
      <span className={styles.adLabel}>Ad</span>

      {/* ── 구글 애드센스 (adSlot 있을 때) ── */}
      {adSlot && adClient ? (
        <ins
          className={`adsbygoogle ${styles.adsense}`}
          style={{ display: 'block' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        /* ── 모의 배너 (개발/데모용) ── */
        <MockBanner placement={placement} variantId={variantId} />
      )}
    </div>
  );
}

AdPlacement.propTypes = {
  placement: PropTypes.oneOf(['feed', 'article', 'sidebar']),
  adSlot:    PropTypes.string,
  adClient:  PropTypes.string,
  className: PropTypes.string,
};

// ── 모의 배너 컴포넌트 ─────────────────────────────────────────────────
function MockBanner({ placement, variantId }) {
  const labels = {
    feed:    ['K-CULTURE PREMIUM', 'Get exclusive access to trends before they go viral'],
    article: ['UPGRADE TO PREMIUM', 'Read all articles ad-free · Exclusive badges · Early access'],
    sidebar: ['KULTURE+', 'Join 2M+ global fans — ad-free experience'],
  };
  const [title, sub] = labels[placement] || labels.feed;

  const accentColors = {
    A: 'var(--accent-pink, #FF2E93)',
    B: 'var(--accent-cyan, #00E5FF)',
    C: 'linear-gradient(90deg, #FF2E93, #00E5FF)',
  };
  const accent = accentColors[variantId] || accentColors.A;
  const isGradient = variantId === 'C';

  return (
    <div className={styles.mockBanner}>
      <div className={styles.mockLeft}>
        <span className={styles.mockIcon}>⚡</span>
        <div>
          <p
            className={styles.mockTitle}
            style={isGradient
              ? { background: accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
              : { color: accent }
            }
          >
            {title}
          </p>
          <p className={styles.mockSub}>{sub}</p>
        </div>
      </div>
      <button
        className={styles.mockCta}
        style={isGradient
          ? { background: accent, color: '#fff' }
          : { background: accent, color: variantId === 'B' ? '#000' : '#fff' }
        }
      >
        Learn More →
      </button>
    </div>
  );
}

MockBanner.propTypes = {
  placement: PropTypes.string,
  variantId: PropTypes.string,
};
