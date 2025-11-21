import { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './ErrorBoundary.module.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 에러 로깅 (추후 Logger 시스템과 통합)
    console.error('[ErrorBoundary] Error caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>문제가 발생했습니다</h1>
            <p className={styles.message}>
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className={styles.details}>
                <summary>에러 상세 정보</summary>
                <pre className={styles.errorStack}>
                  {this.state.error?.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <button onClick={this.handleReset} className={styles.button}>
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className={styles.buttonSecondary}
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onReset: PropTypes.func,
}
