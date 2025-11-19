/**
 * [설명] 관리자 설정 페이지
 * [일시] 2025-11-19 14:00 (KST)
 * [목적] CEO가 모든 기능을 On/Off하고 조정할 수 있는 대시보드
 */

import { useState, useEffect } from 'react';
import { useSiteSettings, updateSiteSettings } from '@/lib/settings';
import styles from './settings.module.css';

export default function AdminSettings() {
  const { settings, loading, error, refresh } = useSiteSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // 간단한 비밀번호 인증 (환경변수 기반)
  const handleAuth = (e) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kulture2025';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  // 세션 확인
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    setPassword('');
  };

  // 입력 변경 핸들러
  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage('');
      await updateSiteSettings(formData);
      setSaveMessage('✅ 설정이 성공적으로 저장되었습니다!');
      await refresh();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('❌ 저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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
              onChange={(e) => setPassword(e.target.value)}
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
    );
  }

  if (loading) {
    return <div className={styles.loading}>⏳ 설정을 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        ❌ 설정을 불러올 수 없습니다: {error.message}
      </div>
    );
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

      {saveMessage && (
        <div className={styles.saveMessage}>{saveMessage}</div>
      )}

      <div className={styles.sections}>
        {/* 콘텐츠 제한 설정 */}
        <section className={styles.section}>
          <h2>📄 콘텐츠 제한 (Content Restriction)</h2>
          <p className={styles.description}>
            비회원이 볼 수 있는 콘텐츠의 양을 제어합니다.
          </p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.contentRestriction.enabled}
                onChange={(e) =>
                  handleChange('contentRestriction', 'enabled', e.target.checked)
                }
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>기능 활성화</span>
            </label>
          </div>

          <div className={styles.field}>
            <label>
              비회원 콘텐츠 노출 비율: {formData.contentRestriction.visiblePercentage}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={formData.contentRestriction.visiblePercentage}
              onChange={(e) =>
                handleChange(
                  'contentRestriction',
                  'visiblePercentage',
                  parseInt(e.target.value)
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
                onChange={(e) =>
                  handleChange('contentRestriction', 'applyToText', e.target.checked)
                }
              />
              본문 텍스트에 적용
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.contentRestriction.applyToComments}
                onChange={(e) =>
                  handleChange('contentRestriction', 'applyToComments', e.target.checked)
                }
              />
              댓글에 적용
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.contentRestriction.applyToImages}
                onChange={(e) =>
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
                onChange={(e) =>
                  handleChange(
                    'contentRestriction',
                    'freeImageCount',
                    parseInt(e.target.value)
                  )
                }
                className={styles.numberInput}
              />
            </label>
          </div>
        </section>

        {/* 광고 시청 설정 */}
        <section className={styles.section}>
          <h2>📺 광고 시청 기능 (Ad Watch Feature)</h2>
          <p className={styles.description}>
            광고 시청으로 콘텐츠 잠금을 해제할 수 있습니다.
          </p>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.adWatchFeature.enabled}
                onChange={(e) =>
                  handleChange('adWatchFeature', 'enabled', e.target.checked)
                }
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>기능 활성화</span>
            </label>
          </div>

          <div className={styles.field}>
            <label>
              광고 최소 시청 시간: {formData.adWatchFeature.adDuration}초
            </label>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={formData.adWatchFeature.adDuration}
              onChange={(e) =>
                handleChange('adWatchFeature', 'adDuration', parseInt(e.target.value))
              }
              className={styles.slider}
            />
          </div>

          <div className={styles.field}>
            <label>
              세션 유효 시간: {formData.adWatchFeature.sessionDuration}분
            </label>
            <input
              type="range"
              min="10"
              max="240"
              step="10"
              value={formData.adWatchFeature.sessionDuration}
              onChange={(e) =>
                handleChange('adWatchFeature', 'sessionDuration', parseInt(e.target.value))
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
                onChange={(e) =>
                  handleChange('adWatchFeature', 'adSenseClientId', e.target.value)
                }
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
                onChange={(e) =>
                  handleChange('adWatchFeature', 'showAsOption', e.target.checked)
                }
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
                onChange={(e) =>
                  handleChange('comments', 'enabled', e.target.checked)
                }
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
                onChange={(e) =>
                  handleChange('comments', 'requireLogin', e.target.checked)
                }
              />
              댓글 작성에 로그인 필수
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.comments.moderationEnabled}
                onChange={(e) =>
                  handleChange('comments', 'moderationEnabled', e.target.checked)
                }
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
                onChange={(e) =>
                  handleChange('authentication', 'allowSignup', e.target.checked)
                }
              />
              신규 회원가입 허용
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.authentication.requireEmailVerification}
                onChange={(e) =>
                  handleChange('authentication', 'requireEmailVerification', e.target.checked)
                }
              />
              이메일 인증 필수
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.authentication.socialLoginEnabled}
                onChange={(e) =>
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
                onChange={(e) =>
                  handleChange('general', 'siteName', e.target.value)
                }
                className={styles.textInput}
              />
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.general.maintenanceMode}
                onChange={(e) =>
                  handleChange('general', 'maintenanceMode', e.target.checked)
                }
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
                value={formData.general.maintenanceMessage}
                onChange={(e) =>
                  handleChange('general', 'maintenanceMessage', e.target.value)
                }
                className={styles.textarea}
                rows="3"
              />
            </label>
          </div>
        </section>
      </div>

      <div className={styles.footer}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveBtn}
        >
          {saving ? '저장 중...' : '💾 모든 설정 저장'}
        </button>
      </div>
    </div>
  );
}
