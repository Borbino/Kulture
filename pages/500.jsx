import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Error.module.css'

export default function Error500() {
  return (
    <>
      <Head>
        <title>500 - 서버 오류 - Kulture</title>
      </Head>

      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorCode}>500</h1>
          <h2 className={styles.errorTitle}>서버 오류가 발생했습니다</h2>
          <p className={styles.errorMessage}>
            문제가 발생했습니다. 나중에 다시 시도해주세요.
          </p>
          <Link href="/">
            <button className={styles.homeBtn}>🏠 홈으로 돌아가기</button>
          </Link>
        </div>
      </div>
    </>
  )
}
