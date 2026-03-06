/**
 * NewsletterSignup Component
 * [목적] 재사용 가능한 뉴스레터 구독 폼 — 푸터, 아티클 하단, 사이드바에 삽입 가능
 * [사용법] <NewsletterSignup variant="inline" /> | variant: "inline" | "card" | "banner"
 */

import PropTypes from 'prop-types'
import { useState } from 'react'
import styles from './NewsletterSignup.module.css'

const PLACEHOLDERS = {
  ko: '이메일 주소를 입력하세요',
  en: 'Enter your email address',
  ja: 'メールアドレスを入力',
  zh: '请输入电子邮件地址',
}

export default function NewsletterSignup({ variant = 'inline', locale = 'ko' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  const placeholder = PLACEHOLDERS[locale] || PLACEHOLDERS.ko

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setMessage('올바른 이메일 주소를 입력해주세요.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || '확인 이메일을 보냈습니다. 받은 편지함을 확인해주세요.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || '구독 신청에 실패했습니다.')
      }
    } catch {
      setStatus('error')
      setMessage('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  if (status === 'success') {
    return (
      <div className={`${styles.wrapper} ${styles[variant]}`}>
        <div className={styles.successState}>
          <span className={styles.successIcon}>📬</span>
          <p className={styles.successText}>{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.wrapper} ${styles[variant]}`}>
      {variant === 'card' && (
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>📰</span>
          <h3 className={styles.cardTitle}>K-Culture 트렌드 뉴스레터</h3>
          <p className={styles.cardDesc}>
            매주 최신 K-Culture 트렌드, VIP 이슈, 이머징 아티스트 소식을 이메일로 받아보세요.
          </p>
        </div>
      )}

      {variant === 'banner' && (
        <div className={styles.bannerText}>
          <strong>📬 무료 K-Culture 뉴스레터</strong>
          <span> — 매주 최신 트렌드를 이메일로 받아보세요</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.inputGroup}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className={styles.input}
            disabled={status === 'loading'}
            autoComplete="email"
            aria-label="이메일 주소"
            required
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={status === 'loading'}
            aria-label="뉴스레터 구독하기"
          >
            {status === 'loading' ? (
              <span className={styles.btnSpinner} />
            ) : (
              '구독하기'
            )}
          </button>
        </div>
        {status === 'error' && (
          <p className={styles.errorMsg} role="alert">{message}</p>
        )}
        <p className={styles.privacyNote}>
          스팸 없음 · 언제든지 수신거부 가능 · 개인정보 보호
        </p>
      </form>
    </div>
  )
}

NewsletterSignup.propTypes = {
  variant: PropTypes.oneOf(['inline', 'card', 'banner']),
  locale: PropTypes.string,
}
