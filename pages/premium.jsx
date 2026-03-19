/**
 * Premium Membership Page
 * [목적] 프리미엄 멤버십 구독 UI — 플랜 선택, 결제 게이트웨이 선택, FAQ
 */

import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import styles from '../styles/Premium.module.css'

// 플랜 정보 (lib/premiumMembership.js PLANS 와 동기화)
const PLANS = [
  {
    id: 'monthly',
    name: '월간 구독',
    price: 4.99,
    currency: 'USD',
    period: '/ 월',
    pricePerMonth: null,
    discount: null,
    features: [
      '광고 없는 순수 콘텐츠 경험',
      '트렌드 데이터 24시간 조기 열람',
      'VIP 이머징 알림 즉시 수신',
      '프리미엄 번역 콘텐츠 전체 열람',
      '월간 K-Culture 트렌드 리포트',
    ],
    badge: null,
    highlight: false,
    emoji: '🌱',
  },
  {
    id: 'annual',
    name: '연간 구독',
    price: 47.99,
    currency: 'USD',
    period: '/ 년',
    pricePerMonth: 4.0,
    discount: '20% 절약',
    features: [
      '월간 구독 모든 혜택 포함',
      '독점 커뮤니티 골드 배지',
      'K-Culture 주간 심층 분석',
      '데이터 다운로드 월 100회',
      '우선 고객 지원 (24h 내 응답)',
    ],
    badge: '🔥 인기',
    highlight: true,
    emoji: '🌟',
  },
  {
    id: 'lifetime',
    name: '평생 구독',
    price: 149.99,
    currency: 'USD',
    period: '일회성',
    pricePerMonth: null,
    discount: null,
    features: [
      '연간 구독 모든 혜택 포함',
      '평생 무제한 액세스',
      '창립 멤버 전용 다이아 배지',
      '신기능 베타 우선 체험',
      '데이터 다운로드 무제한',
    ],
    badge: '💎 베스트 가치',
    highlight: false,
    emoji: '♾️',
  },
]

const FAQS = [
  {
    q: '언제든지 취소할 수 있나요?',
    a: '네, 월간/연간 구독은 언제든지 취소할 수 있습니다. 취소 후 남은 기간은 계속 사용 가능합니다.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '결제 후 7일 이내에 미사용 상태라면 전액 환불됩니다. support@kulture.app으로 문의해주세요.',
  },
  {
    q: '평생 구독은 정말 평생인가요?',
    a: '네, 일회성 결제 후 서비스가 운영되는 한 영구적으로 이용하실 수 있습니다.',
  },
  {
    q: '한국 카드로도 결제할 수 있나요?',
    a: '토스페이먼츠를 선택하면 카카오페이, 네이버페이, 국내 카드 모두 사용 가능합니다.',
  },
  {
    q: '기업/기관 단체 구독이 가능한가요?',
    a: 'B2B 데이터 라이선싱은 별도로 제공됩니다. business@kulture.app으로 문의해주세요.',
  },
  {
    q: '구독 중 플랜 변경이 가능한가요?',
    a: '프로필 > 구독 관리에서 업그레이드/다운그레이드가 가능합니다. 남은 기간은 일 할 계산으로 반영됩니다.',
  },
]

export default function PremiumPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(null) // 로딩 중인 planId
  const [gateway, setGateway] = useState('stripe')
  const [error, setError] = useState(null)

  const handleSubscribe = async (planId) => {
    if (!session) {
      window.location.href = `/auth/signin?callbackUrl=/premium`
      return
    }

    setLoading(planId)
    setError(null)

    try {
      const res = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: planId, gateway }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '결제 시작에 실패했습니다.')
      if (data.url) window.location.href = data.url
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Head>
        <title>프리미엄 멤버십 - Kulture</title>
        <meta
          name="description"
          content="Kulture 프리미엄 멤버십으로 K-Culture 트렌드를 더 깊이, 더 빠르게 경험하세요. 광고 없는 환경, 24시간 조기 열람, VIP 전용 알림."
        />
        <meta property="og:title" content="프리미엄 멤버십 - Kulture" />
        <meta property="og:description" content="K-Culture 트렌드를 더 깊이, 더 빠르게 경험하세요." />
        <meta property="og:type" content="website" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>✨ PREMIUM MEMBERSHIP</p>
          <h1 className={styles.title}>K-Culture의 깊이를 경험하세요</h1>
          <p className={styles.subtitle}>
            광고 없는 환경에서 트렌드를 24시간 먼저 확인하고,
            <br />
            전세계 K-Culture 팬과 더 깊이 연결되세요.
          </p>

          {/* 결제 수단 선택 */}
          <div className={styles.gatewaySwitch}>
            <button
              className={gateway === 'stripe' ? styles.gatewayActive : styles.gatewayBtn}
              onClick={() => setGateway('stripe')}
            >
              💳 국제 카드 (Stripe)
            </button>
            <button
              className={gateway === 'toss' ? styles.gatewayActive : styles.gatewayBtn}
              onClick={() => setGateway('toss')}
            >
              🇰🇷 토스페이먼츠
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* Plan Cards */}
        <section className={styles.plans} aria-label="구독 플랜 목록">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.card} ${plan.highlight ? styles.highlighted : ''}`}
            >
              {plan.badge && (
                <span className={styles.badge}>{plan.badge}</span>
              )}
              <div className={styles.planEmoji}>{plan.emoji}</div>
              <h2 className={styles.planName}>{plan.name}</h2>
              <div className={styles.priceRow}>
                <span className={styles.price}>${plan.price}</span>
                <span className={styles.period}>{plan.period}</span>
              </div>
              {plan.pricePerMonth && (
                <p className={styles.perMonth}>
                  월 ${plan.pricePerMonth} — {plan.discount}
                </p>
              )}
              <ul className={styles.features}>
                {plan.features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.check} aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={plan.highlight ? styles.ctaHighlight : styles.cta}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                aria-label={`${plan.name} 구독 시작하기`}
              >
                {loading === plan.id ? (
                  <span className={styles.loadingSpinner}>처리 중...</span>
                ) : session ? (
                  '지금 시작하기'
                ) : (
                  '로그인 후 시작하기'
                )}
              </button>
            </div>
          ))}
        </section>

        {/* Trust Signals */}
        <section className={styles.trust}>
          <div className={styles.trustItem}>🔒 SSL 암호화 결제</div>
          <div className={styles.trustItem}>🌍 170개국 사용 가능</div>
          <div className={styles.trustItem}>↩️ 7일 환불 보장</div>
          <div className={styles.trustItem}>📱 모든 디바이스 지원</div>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <h2 className={styles.faqTitle}>자주 묻는 질문</h2>
          <div className={styles.faqGrid}>
            {FAQS.map((item, i) => (
              <div key={i} className={styles.faqItem}>
                <h3 className={styles.faqQ}>{item.q}</h3>
                <p className={styles.faqA}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Nav */}
        <div className={styles.pageFooter}>
          <Link href="/" className={styles.backLink}>← 홈으로 돌아가기</Link>
          <p className={styles.support}>
            결제 문의:{' '}
            <a href="mailto:support@kulture.app" className={styles.supportLink}>
              support@kulture.app
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
