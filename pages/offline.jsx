import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Offline.module.css'

export default function Offline() {
  return (
    <>
      <Head>
        <title>오프라인 - Kulture</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.icon}>📡</div>
          <h1>오프라인 모드</h1>
          <p>인터넷 연결이 끊어졌습니다.</p>
          <p className={styles.description}>
            네트워크 연결을 확인하고 다시 시도해주세요.
            <br />
            일부 캐시된 콘텐츠는 오프라인에서도 사용할 수 있습니다.
          </p>

          <div className={styles.actions}>
            <button
              onClick={() => window.location.reload()}
              className={styles.retryBtn}
            >
              다시 시도
            </button>
            <Link href="/">
              <button className={styles.homeBtn}>홈으로</button>
            </Link>
          </div>

          <div className={styles.tips}>
            <h3>💡 팁</h3>
            <ul>
              <li>Wi-Fi 또는 모바일 데이터 연결을 확인하세요</li>
              <li>비행기 모드가 꺼져 있는지 확인하세요</li>
              <li>네트워크가 복구되면 자동으로 동기화됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
