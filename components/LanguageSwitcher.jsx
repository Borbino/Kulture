/**
 * Language Switcher Component
 * 100+ languages support with auto-detection
 */

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from './LanguageSwitcher.module.css';
import { SUPPORTED_LANGUAGES } from '../lib/languages.js';

export default function LanguageSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  // 현재 선택된 언어
  const currentLocale = router.locale || 'ko';
  const currentLanguageName = SUPPORTED_LANGUAGES[currentLocale] || currentLocale;

  // 자동 언어 감지
  useEffect(() => {
    detectUserLanguage();
  }, []);

  const detectUserLanguage = async () => {
    try {
      // 브라우저 언어 감지
      const browserLang = (typeof globalThis !== 'undefined' && globalThis.navigator)
        ? globalThis.navigator.language.split('-')[0]
        : 'en';
      if (browserLang && SUPPORTED_LANGUAGES[browserLang] && browserLang !== currentLocale) {
        setDetectedLanguage(browserLang);
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }
  };

  // 언어 변경
  const changeLanguage = (locale) => {
    router.push(router.pathname, router.asPath, { locale });
    setIsOpen(false);
    setSearchQuery('');
    
    // 사용자 선호 언어 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', locale);
    }
  };

  // 감지된 언어로 전환
  const switchToDetectedLanguage = () => {
    if (detectedLanguage) {
      changeLanguage(detectedLanguage);
      setDetectedLanguage(null);
    }
  };

  // 언어 필터링
  const filteredLanguages = Object.entries(SUPPORTED_LANGUAGES).filter(([code, name]) => {
    const query = searchQuery.toLowerCase();
    return (
      code.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query)
    );
  });

  // 인기 언어 (상위 20개)
  const popularLanguages = [
    'en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'es', 'fr', 'de', 'ru', 'pt',
    'it', 'ar', 'hi', 'vi', 'th', 'tr', 'pl', 'nl', 'id', 'sv'
  ];

  return (
    <>
      {/* 언어 감지 알림 */}
      {detectedLanguage && (
        <div className={styles.detectionBanner}>
          <span>
            🌐 {SUPPORTED_LANGUAGES[detectedLanguage]} 사용자이신가요?
          </span>
          <button onClick={switchToDetectedLanguage} className={styles.switchButton}>
            전환하기
          </button>
          <button onClick={() => setDetectedLanguage(null)} className={styles.closeButton}>
            ✕
          </button>
        </div>
      )}

      {/* 언어 선택 버튼 */}
      <div className={styles.languageSwitcher}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.toggleButton}
          aria-label="언어 선택"
        >
          🌍 {currentLanguageName}
          <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
        </button>

        {/* 언어 목록 드롭다운 */}
        {isOpen && (
          <div className={styles.dropdown}>
            {/* 검색 입력 */}
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="언어 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
            </div>

            {/* 인기 언어 */}
            {!searchQuery && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>인기 언어</div>
                <div className={styles.languageGrid}>
                  {popularLanguages.map(code => (
                    <button
                      key={code}
                      onClick={() => changeLanguage(code)}
                      className={`${styles.languageItem} ${
                        currentLocale === code ? styles.active : ''
                      }`}
                    >
                      <span className={styles.languageCode}>{code}</span>
                      <span className={styles.languageName}>{SUPPORTED_LANGUAGES[code]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 전체 언어 목록 */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {searchQuery ? '검색 결과' : '모든 언어'} ({filteredLanguages.length})
              </div>
              <div className={styles.languageList}>
                {filteredLanguages.map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => changeLanguage(code)}
                    className={`${styles.languageItem} ${
                      currentLocale === code ? styles.active : ''
                    }`}
                  >
                    <span className={styles.languageCode}>{code}</span>
                    <span className={styles.languageName}>{name}</span>
                    {currentLocale === code && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filteredLanguages.length === 0 && (
              <div className={styles.noResults}>
                일치하는 언어가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 클릭 외부 영역 닫기 */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
