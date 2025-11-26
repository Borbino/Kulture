import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import PropTypes from 'prop-types';
import styles from './ContributeTranslation.module.css';

export default function ContributeTranslation({ translationKey, originalText, currentTranslation }) {
  const { i18n } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState(currentTranslation || '');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/translation/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: translationKey,
          original: originalText,
          translated: newTranslation,
          targetLanguage: i18n.language,
          feedback,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        alert('번역 제출에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to submit translation:', error);
      alert('번역 제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={styles.contributeBtn}
        title="번역 개선하기"
      >
        ✏️ 번역 개선
      </button>

      {isOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>번역 기여하기</h3>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>원문 (한국어):</label>
                <div className={styles.originalText}>{originalText}</div>
              </div>

              <div className={styles.formGroup}>
                <label>현재 번역 ({i18n.language}):</label>
                <div className={styles.currentText}>{currentTranslation || '번역 없음'}</div>
              </div>

              <div className={styles.formGroup}>
                <label>개선된 번역:</label>
                <textarea
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="더 나은 번역을 입력하세요..."
                  className={styles.textarea}
                  required
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>설명 (선택사항):</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="번역을 개선한 이유를 설명해주세요..."
                  className={styles.textarea}
                  rows={2}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={submitting || !newTranslation}
                  className={styles.submitBtn}
                >
                  {submitting ? '제출 중...' : '제출하기'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={styles.cancelBtn}
                >
                  취소
                </button>
              </div>

              {success && (
                <div className={styles.successMessage}>
                  ✓ 번역이 성공적으로 제출되었습니다! 검토 후 반영됩니다.
                </div>
              )}
            </form>

            <div className={styles.guidelines}>
              <h4>번역 가이드라인:</h4>
              <ul>
                <li>자연스럽고 이해하기 쉬운 번역을 제공해주세요</li>
                <li>문화적 맥락을 고려해주세요</li>
                <li>일관된 용어를 사용해주세요</li>
                <li>직역보다는 의역을 선호합니다</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ContributeTranslation.propTypes = {
  translationKey: PropTypes.string.isRequired,
  originalText: PropTypes.string.isRequired,
  currentTranslation: PropTypes.string,
};
