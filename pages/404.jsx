import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Error.module.css'

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - 페이지를 찾을 수 없습니다 - Kulture</title>
      </Head>

      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.errorTitle}>페이지를 찾을 수 없습니다</h2>
          <p className={styles.errorMessage}>
            요청하신 페이지가 존재하지 않거나 삭제되었습니다.
          </p>
          <Link href="/">
            <button className={styles.homeBtn}>🏠 홈으로 돌아가기</button>
          </Link>
        </div>
      </div>
    </>
  )
}
