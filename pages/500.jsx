import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/500.module.css'

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - 서버 오류 | Kulture</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.code}>500</h1>
          <h2 className={styles.title}>서버 오류가 발생했습니다</h2>
          <p className={styles.message}>
            일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <div className={styles.actions}>
            <button onClick={() => window.location.reload()} className={styles.button}>
              새로고침
            </button>
            <Link href="/" className={styles.buttonSecondary}>
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
