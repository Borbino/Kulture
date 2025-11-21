import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/404.module.css'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - 페이지를 찾을 수 없습니다 | Kulture</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.code}>404</h1>
          <h2 className={styles.title}>페이지를 찾을 수 없습니다</h2>
          <p className={styles.message}>
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          <Link href="/" className={styles.button}>
            홈으로 이동
          </Link>
        </div>
      </div>
    </>
  )
}
