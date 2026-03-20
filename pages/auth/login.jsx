import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../../styles/Auth.module.css'

export default function Login() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // 회원가입
        if (formData.password !== formData.confirmPassword) {
          setError('비밀번호가 일치하지 않습니다')
          setLoading(false)
          return
        }

        const signUpRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        })

        const signUpData = await signUpRes.json()

        if (!signUpRes.ok) {
          setError(signUpData.error || '회원가입 실패')
          setLoading(false)
          return
        }

        // 회원가입 후 자동 로그인
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          setError(result.error)
        } else {
          router.push('/')
        }
      } else {
        // 로그인
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          setError(result.error)
        } else {
          router.push('/')
        }
      }
    } catch (err) {
      setError(err.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    setLoading(true)
    try {
      const result = await signIn(provider, { redirect: false })
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/')
      }
    } catch {
      setError('OAuth 로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{isSignUp ? '회원가입' : '로그인'} - Kulture</title>
      </Head>

      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          {/* Logo */}
          <div className={styles.authLogo}>
            <Link href="/">
              <h1>🌏 Kulture</h1>
            </Link>
            <p>한국 문화를 사랑하는 글로벌 커뮤니티</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.authForm}>
            <h2>{isSignUp ? '회원가입' : '로그인'}</h2>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {isSignUp && (
              <div className={styles.formGroup}>
                <label htmlFor="name">이름</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력하세요"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="8자 이상"
                required
                disabled={loading}
              />
            </div>

            {isSignUp && (
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? '처리 중...'
                : isSignUp
                ? '회원가입'
                : '로그인'}
            </button>
          </form>

          {/* OAuth Providers */}
          <div className={styles.oauthSection}>
            <div className={styles.divider}>또는</div>
            <button
              type="button"
              className={styles.oauthBtn}
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
            >
              🔍 Google로 계속
            </button>
            <button
              type="button"
              className={styles.oauthBtn}
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
            >
              🐙 GitHub로 계속
            </button>
          </div>

          {/* Toggle */}
          <div className={styles.toggleAuth}>
            {isSignUp ? (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false)
                    setError('')
                  }}
                >
                  로그인
                </button>
              </>
            ) : (
              <>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true)
                    setError('')
                  }}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
