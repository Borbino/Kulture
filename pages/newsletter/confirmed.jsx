/**
 * Newsletter Subscription Confirmed Page
 * [목적] 이메일 구독 확인 완료 페이지 (/newsletter/confirmed?token=xxx)
 */

import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/NewsletterConfirmed.module.css'

export default function NewsletterConfirmedPage() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return

    const confirm = async () => {
      try {
        const res = await fetch(`/api/newsletter/subscribe?action=confirm&token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (res.ok && data.confirmed) {
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(data.error || '확인에 실패했습니다.')
        }
      } catch {
        setStatus('error')
        setMessage('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }

    confirm()
  }, [token])

  return (
    <>
      <Head>
        <title>구독 확인 - Kulture</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.container}>
        {status === 'loading' && (
          <div className={styles.card}>
            <div className={styles.spinner} aria-label="확인 중" />
            <p className={styles.loadingText}>구독을 확인하고 있습니다...</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.card}>
            <div className={styles.icon}>✅</div>
            <h1 className={styles.title}>구독 확인 완료!</h1>
            <p className={styles.body}>
              Kulture K-Culture 뉴스레터 구독이 완료되었습니다.
              <br />
              매주 최신 K-Culture 트렌드와 VIP 이슈를 이메일로 받아보세요.
            </p>
            <div className={styles.actions}>
              <Link href="/trends" className={styles.btnPrimary}>
                🔥 트렌드 보러가기
              </Link>
              <Link href="/" className={styles.btnSecondary}>
                홈으로
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.card}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>확인 실패</h1>
            <p className={styles.body}>
              {message}
              <br />
              링크가 만료되었거나 이미 확인된 경우 이 오류가 발생합니다.
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btnSecondary}>
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
