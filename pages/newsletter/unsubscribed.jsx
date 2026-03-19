/**
 * Newsletter Unsubscribed Page
 * [목적] 수신거부 완료 페이지 (/newsletter/unsubscribed?token=xxx)
 */

import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/NewsletterConfirmed.module.css'

export default function NewsletterUnsubscribedPage() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return

    const unsubscribe = async () => {
      try {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(data.error || '수신거부 처리에 실패했습니다.')
        }
      } catch {
        setStatus('error')
        setMessage('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }

    unsubscribe()
  }, [token])

  return (
    <>
      <Head>
        <title>수신거부 완료 - Kulture</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.container}>
        {status === 'loading' && (
          <div className={styles.card}>
            <div className={styles.spinner} aria-label="처리 중" />
            <p className={styles.loadingText}>수신거부를 처리하고 있습니다...</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.card}>
            <div className={styles.icon}>👋</div>
            <h1 className={styles.title}>수신거부 완료</h1>
            <p className={styles.body}>
              Kulture 뉴스레터 수신거부가 완료되었습니다.
              <br />
              더 이상 이메일을 받지 않으실 것입니다.
              <br />
              언제든지 다시 구독하실 수 있습니다.
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btnPrimary}>
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.card}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>처리 실패</h1>
            <p className={styles.body}>
              {message}
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btnSecondary}>홈으로</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
