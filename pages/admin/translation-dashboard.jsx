import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from './translation-dashboard.module.css';

export default function TranslationDashboard() {
  const { t, i18n } = useTranslation('common');
  const [stats, setStats] = useState(null);
  const [translations, setTranslations] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('ko');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchTranslations();
  }, [selectedLanguage, filter]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/translation/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/translation/list?lang=${selectedLanguage}&filter=${filter}`);
      const data = await res.json();
      setTranslations(data.translations || []);
    } catch (error) {
      console.error('Failed to fetch translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (translationId) => {
    try {
      await fetch(`/api/translation/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: translationId }),
      });
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (translationId, reason) => {
    try {
      await fetch(`/api/translation/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: translationId, reason }),
      });
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/translation/export?lang=${selectedLanguage}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedLanguage}-translations.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const languages = [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'pt', name: 'Português' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>번역 관리 대시보드</h1>
        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.exportBtn}>
            내보내기
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>총 언어</h3>
            <p className={styles.statValue}>{stats.totalLanguages || 100}</p>
          </div>
          <div className={styles.statCard}>
            <h3>총 번역</h3>
            <p className={styles.statValue}>{stats.totalTranslations || 0}</p>
          </div>
          <div className={styles.statCard}>
            <h3>대기 중</h3>
            <p className={styles.statValue}>{stats.pendingTranslations || 0}</p>
          </div>
          <div className={styles.statCard}>
            <h3>승인됨</h3>
            <p className={styles.statValue}>{stats.approvedTranslations || 0}</p>
          </div>
          <div className={styles.statCard}>
            <h3>완성률</h3>
            <p className={styles.statValue}>
              {stats.completionRate ? `${Math.round(stats.completionRate)}%` : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>언어:</label>
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={styles.select}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>상태:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">전체</option>
            <option value="pending">대기 중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거부됨</option>
          </select>
        </div>
      </div>

      {/* Translations Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>키</th>
                <th>원본 (한국어)</th>
                <th>번역 ({selectedLanguage})</th>
                <th>기여자</th>
                <th>상태</th>
                <th>품질 점수</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {translations.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.empty}>
                    번역이 없습니다
                  </td>
                </tr>
              ) : (
                translations.map((trans) => (
                  <TranslationRow 
                    key={trans.id}
                    translation={trans}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TranslationRow({ translation, onApprove, onReject }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectSubmit = () => {
    onReject(translation.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '대기 중', className: styles.statusPending },
      approved: { text: '승인됨', className: styles.statusApproved },
      rejected: { text: '거부됨', className: styles.statusRejected },
    };
    const badge = badges[status] || badges.pending;
    return <span className={badge.className}>{badge.text}</span>;
  };

  const getQualityColor = (score) => {
    if (score >= 8) return styles.qualityHigh;
    if (score >= 6) return styles.qualityMedium;
    return styles.qualityLow;
  };

  return (
    <>
      <tr className={styles.translationRow}>
        <td className={styles.keyCell}>{translation.key}</td>
        <td className={styles.originalCell}>{translation.original}</td>
        <td className={styles.translatedCell}>{translation.translated}</td>
        <td className={styles.contributorCell}>
          {translation.contributor?.name || '시스템'}
        </td>
        <td className={styles.statusCell}>
          {getStatusBadge(translation.status)}
        </td>
        <td className={styles.qualityCell}>
          <span className={getQualityColor(translation.qualityScore)}>
            {translation.qualityScore ? `${translation.qualityScore}/10` : 'N/A'}
          </span>
        </td>
        <td className={styles.actionsCell}>
          {translation.status === 'pending' && (
            <>
              <button 
                onClick={() => onApprove(translation.id)}
                className={styles.approveBtn}
              >
                승인
              </button>
              <button 
                onClick={() => setShowRejectModal(true)}
                className={styles.rejectBtn}
              >
                거부
              </button>
            </>
          )}
        </td>
      </tr>

      {showRejectModal && (
        <tr>
          <td colSpan="7">
            <div className={styles.rejectModal}>
              <h4>거부 사유</h4>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거부 사유를 입력하세요..."
                className={styles.textarea}
              />
              <div className={styles.modalActions}>
                <button onClick={handleRejectSubmit} className={styles.submitBtn}>
                  제출
                </button>
                <button onClick={() => setShowRejectModal(false)} className={styles.cancelBtn}>
                  취소
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
