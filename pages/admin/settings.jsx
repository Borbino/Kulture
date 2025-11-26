/**
 * [설명] 관리자 설정 페이지
 * [일시] 2025-11-19 14:00 (KST)
 * [목적] CEO가 모든 기능을 On/Off하고 조정할 수 있는 대시보드
 */

import { useState, useEffect, useRef } from 'react'
import { useSiteSettings, updateSiteSettings } from '../../lib/settings.js'
import styles from './settings.module.css'

export default function AdminSettings() {
  const { settings, loading, error, refresh } = useSiteSettings()
  const [formData, setFormData] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const saveMessageTimerRef = useRef(null)

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  // 클린업: 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (saveMessageTimerRef.current) {
        clearTimeout(saveMessageTimerRef.current)
      }
    }
  }, [])

  // 간단한 비밀번호 인증 (환경변수 기반)
  const handleAuth = e => {
    e.preventDefault()
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kulture2025'
    if (password === adminPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
    } else {
      alert('비밀번호가 올바르지 않습니다.')
    }
  }

  // 세션 확인
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
    setPassword('')
  }

  // 입력 변경 핸들러
  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage('')
      // 이전 타이머가 있으면 정리
      if (saveMessageTimerRef.current) {
        clearTimeout(saveMessageTimerRef.current)
      }
      await updateSiteSettings(formData)
      setSaveMessage('✅ 설정이 성공적으로 저장되었습니다!')
      await refresh()
      saveMessageTimerRef.current = setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setSaveMessage('❌ 저장 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // 인증되지 않은 경우 로그인 화면
  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1>🔐 관리자 인증</h1>
          <p>관리자 페이지에 접근하려면 비밀번호를 입력하세요.</p>
          <form onSubmit={handleAuth}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              className={styles.passwordInput}
              autoFocus
            />
            <button type="submit" className={styles.loginBtn}>
              로그인
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className={styles.loading}>⏳ 설정을 불러오는 중...</div>
  }

  if (error) {
    return <div className={styles.error}>❌ 설정을 불러올 수 없습니다: {error.message}</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>⚙️ Kulture 관리자 설정</h1>
        <div className={styles.headerActions}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            로그아웃
          </button>
        </div>
      </header>

      {saveMessage && <div className={styles.saveMessage}>{saveMessage}</div>}

      <div className={styles.sections}>
        {/* 콘텐츠 제한 설정 */}
        <section className={styles.section}>
          <h2>📄 콘텐츠 제한 (Content Restriction)</h2>
          <p className={styles.description}>비회원이 볼 수 있는 콘텐츠의 양을 제어합니다.</p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.contentRestriction.enabled}
                onChange={e => handleChange('contentRestriction', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>기능 활성화</span>
            </label>
          </div>

          <div className={styles.field}>
            <label>비회원 콘텐츠 노출 비율: {formData.contentRestriction.visiblePercentage}%</label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={formData.contentRestriction.visiblePercentage}
              onChange={e =>
                handleChange(
                  'contentRestriction',
                  'visiblePercentage',
                  parseInt(e.target.value, 10)
                )
              }
              className={styles.slider}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.contentRestriction.applyToText}
                onChange={e => handleChange('contentRestriction', 'applyToText', e.target.checked)}
              />
              본문 텍스트에 적용
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.contentRestriction.applyToComments}
                onChange={e =>
                  handleChange('contentRestriction', 'applyToComments', e.target.checked)
                }
              />
              댓글에 적용
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.contentRestriction.applyToImages}
                onChange={e =>
                  handleChange('contentRestriction', 'applyToImages', e.target.checked)
                }
              />
              이미지에 적용
            </label>
          </div>

          <div className={styles.field}>
            <label>
              무료로 볼 수 있는 이미지 개수
              <input
                type="number"
                min="0"
                max="10"
                value={formData.contentRestriction.freeImageCount}
                onChange={e =>
                  handleChange('contentRestriction', 'freeImageCount', parseInt(e.target.value, 10))
                }
                className={styles.numberInput}
              />
            </label>
          </div>
        </section>

        {/* 광고 시청 설정 */}
        <section className={styles.section}>
          <h2>📺 광고 시청 기능 (Ad Watch Feature)</h2>
          <p className={styles.description}>광고 시청으로 콘텐츠 잠금을 해제할 수 있습니다.</p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.adWatchFeature.enabled}
                onChange={e => handleChange('adWatchFeature', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>기능 활성화</span>
            </label>
          </div>

          <div className={styles.field}>
            <label>광고 최소 시청 시간: {formData.adWatchFeature.adDuration}초</label>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={formData.adWatchFeature.adDuration}
              onChange={e =>
                handleChange('adWatchFeature', 'adDuration', parseInt(e.target.value, 10))
              }
              className={styles.slider}
            />
          </div>

          <div className={styles.field}>
            <label>세션 유효 시간: {formData.adWatchFeature.sessionDuration}분</label>
            <input
              type="range"
              min="10"
              max="240"
              step="10"
              value={formData.adWatchFeature.sessionDuration}
              onChange={e =>
                handleChange('adWatchFeature', 'sessionDuration', parseInt(e.target.value, 10))
              }
              className={styles.slider}
            />
          </div>

          <div className={styles.field}>
            <label>
              Google AdSense Client ID
              <input
                type="text"
                value={formData.adWatchFeature.adSenseClientId}
                onChange={e => handleChange('adWatchFeature', 'adSenseClientId', e.target.value)}
                className={styles.textInput}
                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
              />
            </label>
          </div>

          <div className={styles.field}>
            <label>
              <input
                type="checkbox"
                checked={formData.adWatchFeature.showAsOption}
                onChange={e => handleChange('adWatchFeature', 'showAsOption', e.target.checked)}
              />
              로그인과 함께 옵션으로 제시 (비활성화 시 광고만 표시)
            </label>
          </div>
        </section>

        {/* 댓글 설정 */}
        <section className={styles.section}>
          <h2>💬 댓글 (Comments)</h2>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.comments.enabled}
                onChange={e => handleChange('comments', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>댓글 기능 활성화</span>
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.comments.requireLogin}
                onChange={e => handleChange('comments', 'requireLogin', e.target.checked)}
              />
              댓글 작성에 로그인 필수
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.comments.moderationEnabled}
                onChange={e => handleChange('comments', 'moderationEnabled', e.target.checked)}
              />
              댓글 승인 시스템 활성화
            </label>
          </div>
        </section>

        {/* 인증 설정 */}
        <section className={styles.section}>
          <h2>🔐 회원 인증 (Authentication)</h2>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.authentication.allowSignup}
                onChange={e => handleChange('authentication', 'allowSignup', e.target.checked)}
              />
              신규 회원가입 허용
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.authentication.requireEmailVerification}
                onChange={e =>
                  handleChange('authentication', 'requireEmailVerification', e.target.checked)
                }
              />
              이메일 인증 필수
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.authentication.socialLoginEnabled}
                onChange={e =>
                  handleChange('authentication', 'socialLoginEnabled', e.target.checked)
                }
              />
              소셜 로그인 활성화
            </label>
          </div>
        </section>

        {/* 일반 설정 */}
        <section className={styles.section}>
          <h2>⚙️ 일반 설정 (General)</h2>

          <div className={styles.field}>
            <label>
              사이트 이름
              <input
                type="text"
                value={formData.general.siteName}
                onChange={e => handleChange('general', 'siteName', e.target.value)}
                className={styles.textInput}
              />
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.general?.maintenanceMode ?? false}
                onChange={e => handleChange('general', 'maintenanceMode', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>
                점검 모드 (모든 방문자에게 점검 페이지 표시)
              </span>
            </label>
          </div>

          <div className={styles.field}>
            <label>
              점검 중 메시지
              <textarea
                value={formData.general?.maintenanceMessage ?? ''}
                onChange={e => handleChange('general', 'maintenanceMessage', e.target.value)}
                className={styles.textarea}
                rows="3"
              />
            </label>
          </div>
        </section>

        {/* 번역 시스템 설정 */}
        <section className={styles.section}>
          <h2>🌐 번역 시스템 (Translation System)</h2>
          <p className={styles.description}>200+ 언어 자동 번역 기능을 제어합니다.</p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.translationSystem?.enabled ?? true}
                onChange={e => handleChange('translationSystem', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>번역 시스템 활성화</span>
            </label>
          </div>

          <div className={styles.field}>
            <label>
              기본 언어
              <select
                value={formData.translationSystem?.defaultLanguage ?? 'ko'}
                onChange={e => handleChange('translationSystem', 'defaultLanguage', e.target.value)}
                className={styles.select}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </label>
          </div>

          <div className={styles.field}>
            <label>번역 품질 기준: {formData.translationSystem?.qualityThreshold ?? 7}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.translationSystem?.qualityThreshold ?? 7}
              onChange={e => handleChange('translationSystem', 'qualityThreshold', parseInt(e.target.value, 10))}
              className={styles.slider}
            />
          </div>

          <div className={styles.field}>
            <label>
              우선 번역 제공자
              <select
                value={formData.translationSystem?.primaryProvider ?? 'openai'}
                onChange={e => handleChange('translationSystem', 'primaryProvider', e.target.value)}
                className={styles.select}
              >
                <option value="openai">OpenAI (권장)</option>
                <option value="deepl">DeepL (고품질)</option>
                <option value="google">Google Translate</option>
              </select>
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.translationSystem?.enableCache ?? true}
                onChange={e => handleChange('translationSystem', 'enableCache', e.target.checked)}
              />
              Redis 캐시 활성화
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.translationSystem?.autoDetectLanguage ?? true}
                onChange={e => handleChange('translationSystem', 'autoDetectLanguage', e.target.checked)}
              />
              언어 자동 감지
            </label>
          </div>
        </section>

        {/* 게임화 시스템 설정 */}
        <section className={styles.section}>
          <h2>🎮 게임화 시스템 (Gamification)</h2>
          <p className={styles.description}>사용자 참여를 높이는 게임화 요소를 제어합니다.</p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.gamification?.enabled ?? true}
                onChange={e => handleChange('gamification', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>게임화 시스템 활성화</span>
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.gamification?.dailyMissionsEnabled ?? true}
                onChange={e => handleChange('gamification', 'dailyMissionsEnabled', e.target.checked)}
              />
              일일 미션 시스템
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.gamification?.levelSystemEnabled ?? true}
                onChange={e => handleChange('gamification', 'levelSystemEnabled', e.target.checked)}
              />
              레벨 시스템 (0-10 레벨)
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.gamification?.badgesEnabled ?? true}
                onChange={e => handleChange('gamification', 'badgesEnabled', e.target.checked)}
              />
              뱃지 시스템
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.gamification?.streakBonusEnabled ?? true}
                onChange={e => handleChange('gamification', 'streakBonusEnabled', e.target.checked)}
              />
              연속 활동 보너스
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.gamification?.leaderboardEnabled ?? true}
                onChange={e => handleChange('gamification', 'leaderboardEnabled', e.target.checked)}
              />
              리더보드 표시
            </label>
          </div>

          <div className={styles.field}>
            <label>포인트 배율: {formData.gamification?.pointMultiplier ?? 1.0}x</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={formData.gamification?.pointMultiplier ?? 1.0}
              onChange={e => handleChange('gamification', 'pointMultiplier', parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>
        </section>

        {/* 실시간 채팅 설정 */}
        <section className={styles.section}>
          <h2>💬 실시간 채팅 (Real-time Chat)</h2>
          <p className={styles.description}>WebSocket 기반 실시간 채팅 기능을 제어합니다.</p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.realTimeChat?.enabled ?? true}
                onChange={e => handleChange('realTimeChat', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>실시간 채팅 활성화</span>
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.realTimeChat?.autoTranslate ?? true}
                onChange={e => handleChange('realTimeChat', 'autoTranslate', e.target.checked)}
              />
              메시지 자동 번역
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.realTimeChat?.typingIndicatorEnabled ?? true}
                onChange={e => handleChange('realTimeChat', 'typingIndicatorEnabled', e.target.checked)}
              />
              타이핑 중 표시
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.realTimeChat?.requireLogin ?? true}
                onChange={e => handleChange('realTimeChat', 'requireLogin', e.target.checked)}
              />
              로그인 필수
            </label>
          </div>

          <div className={styles.field}>
            <label>메시지 히스토리 개수: {formData.realTimeChat?.messageHistoryCount ?? 50}</label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={formData.realTimeChat?.messageHistoryCount ?? 50}
              onChange={e => handleChange('realTimeChat', 'messageHistoryCount', parseInt(e.target.value, 10))}
              className={styles.slider}
            />
          </div>

          <div className={styles.field}>
            <label>최대 채팅방 인원: {formData.realTimeChat?.maxRoomSize ?? 100}</label>
            <input
              type="range"
              min="2"
              max="1000"
              step="10"
              value={formData.realTimeChat?.maxRoomSize ?? 100}
              onChange={e => handleChange('realTimeChat', 'maxRoomSize', parseInt(e.target.value, 10))}
              className={styles.slider}
            />
          </div>
        </section>

        {/* AI 콘텐츠 생성 설정 */}
        <section className={styles.section}>
          <h2>🤖 AI 콘텐츠 생성 (AI Content Generation)</h2>
          <p className={styles.description}>AI 기반 K-Culture 콘텐츠 자동 생성을 제어합니다.</p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.aiContentGeneration?.enabled ?? true}
                onChange={e => handleChange('aiContentGeneration', 'enabled', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>AI 콘텐츠 생성 활성화</span>
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.aiContentGeneration?.requireCeoApproval ?? true}
                onChange={e => handleChange('aiContentGeneration', 'requireCeoApproval', e.target.checked)}
              />
              CEO 승인 필수
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.aiContentGeneration?.multilingualPublish ?? true}
                onChange={e => handleChange('aiContentGeneration', 'multilingualPublish', e.target.checked)}
              />
              다국어 동시 발행 (200+ 언어)
            </label>
          </div>

          <div className={styles.field}>
            <label>생성 가능한 콘텐츠 타입</label>
            <div className={styles.checkboxGroup}>
              {['article', 'guide', 'review', 'news', 'tutorial'].map(type => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={formData.aiContentGeneration?.contentTypes?.includes(type) ?? true}
                    onChange={e => {
                      const current = formData.aiContentGeneration?.contentTypes || []
                      const updated = e.target.checked
                        ? [...current, type]
                        : current.filter(t => t !== type)
                      handleChange('aiContentGeneration', 'contentTypes', updated)
                    }}
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* 소셜 기능 설정 */}
        <section className={styles.section}>
          <h2>👥 소셜 기능 (Social Features)</h2>
          <p className={styles.description}>커뮤니티 소셜 네트워킹 기능을 제어합니다.</p>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.socialFeatures?.followSystemEnabled ?? true}
                onChange={e => handleChange('socialFeatures', 'followSystemEnabled', e.target.checked)}
              />
              팔로우 시스템
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.socialFeatures?.reactionsEnabled ?? true}
                onChange={e => handleChange('socialFeatures', 'reactionsEnabled', e.target.checked)}
              />
              이모지 반응
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.socialFeatures?.activityFeedEnabled ?? true}
                onChange={e => handleChange('socialFeatures', 'activityFeedEnabled', e.target.checked)}
              />
              활동 피드
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.socialFeatures?.userProfilesEnabled ?? true}
                onChange={e => handleChange('socialFeatures', 'userProfilesEnabled', e.target.checked)}
              />
              사용자 프로필
            </label>
          </div>

          <div className={styles.field}>
            <label>사용 가능한 반응 타입</label>
            <div className={styles.checkboxGroup}>
              {[
                { value: 'love', label: '❤️ Love' },
                { value: 'like', label: '👍 Like' },
                { value: 'laugh', label: '😂 Laugh' },
                { value: 'wow', label: '😮 Wow' },
                { value: 'sad', label: '😢 Sad' },
                { value: 'angry', label: '😡 Angry' },
              ].map(reaction => (
                <label key={reaction.value}>
                  <input
                    type="checkbox"
                    checked={formData.socialFeatures?.enabledReactions?.includes(reaction.value) ?? true}
                    onChange={e => {
                      const current = formData.socialFeatures?.enabledReactions || []
                      const updated = e.target.checked
                        ? [...current, reaction.value]
                        : current.filter(r => r !== reaction.value)
                      handleChange('socialFeatures', 'enabledReactions', updated)
                    }}
                  />
                  {reaction.label}
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={styles.footer}>
        <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
          {saving ? '저장 중...' : '💾 모든 설정 저장'}
        </button>
      </div>
    </div>
  )
}
