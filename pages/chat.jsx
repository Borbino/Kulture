import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import RealtimeChat from '../components/RealtimeChat'
import Toast from '../components/Toast'
import styles from '../styles/Chat.module.css'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <Head>
        <title>채팅 - Kulture</title>
      </Head>

      {toastMessage && <Toast message={toastMessage} />}

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/">
            <button className={styles.backBtn}>← 돌아가기</button>
          </Link>
          <h1>💬 실시간 채팅</h1>
          <div />
        </div>

        {/* Chat Room */}
        <RealtimeChat
          onMessageSent={() => {
            setToastMessage('✅ 메시지가 전송되었습니다!')
            setTimeout(() => setToastMessage(''), 2000)
          }}
        />
      </div>
    </>
  )
}
