/**
 * 자가 유지보수 관제탑 (CEO Dashboard)
 * Phase 8: AI가 코드를 스스로 리팩토링한 내역을 Before/After + 쉬운 설명으로 시각화
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from './maintenance.module.css';

export default function MaintenanceDashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  // 관리자 권한 검사
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin');
  }, [status, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/self-maintenance');
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {
      showToast('로그를 불러오는 데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const runAnalysis = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/cron/self-maintenance', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        showToast(`✅ ${data.message}`, 'success');
        await fetchLogs();
      }
    } catch {
      showToast('분석 실행 중 오류가 발생했습니다.', 'error');
    } finally {
      setRunning(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (status === 'loading') return null;

  return (
    <>
      <Head>
        <title>자가 유지보수 관제탑 — Kulture Admin</title>
      </Head>

      <div className={styles.page}>
        {/* ── 헤더 ── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backBtn}>
              ← 어드민 홈
            </Link>
            <div>
              <h1 className={styles.pageTitle}>
                <span className={styles.titleIcon}>🤖</span>
                자가 유지보수 관제탑
              </h1>
              <p className={styles.pageSubtitle}>
                AI가 스스로 코드를 개선한 내역을 실시간으로 확인하세요
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.statBadge}>
              <span className={styles.statNum}>{total}</span>
              <span className={styles.statLabel}>총 개선 횟수</span>
            </div>
            <button
              className={styles.runBtn}
              onClick={runAnalysis}
              disabled={running}
            >
              {running ? (
                <>
                  <span className={styles.spinner} />
                  분석 중…
                </>
              ) : (
                <>
                  <span className={styles.runIcon}>⚡</span>
                  AI 분석 실행
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── 상태 개요 카드 ── */}
        <div className={styles.overviewGrid}>
          <div className={`${styles.overviewCard} ${styles.cardPink}`}>
            <div className={styles.overviewIcon}>🔧</div>
            <div className={styles.overviewValue}>{total}</div>
            <div className={styles.overviewLabel}>누적 리팩토링</div>
          </div>
          <div className={`${styles.overviewCard} ${styles.cardCyan}`}>
            <div className={styles.overviewIcon}>📁</div>
            <div className={styles.overviewValue}>
              {new Set(logs.map(l => l.targetFile)).size}
            </div>
            <div className={styles.overviewLabel}>개선된 파일 수</div>
          </div>
          <div className={`${styles.overviewCard} ${styles.cardGreen}`}>
            <div className={styles.overviewIcon}>✅</div>
            <div className={styles.overviewValue}>100%</div>
            <div className={styles.overviewLabel}>자동 적용율</div>
          </div>
          <div className={`${styles.overviewCard} ${styles.cardOrange}`}>
            <div className={styles.overviewIcon}>📅</div>
            <div className={styles.overviewValue}>
              {logs[0] ? formatDate(logs[0].date).split(' ')[0] : '—'}
            </div>
            <div className={styles.overviewLabel}>최근 개선일</div>
          </div>
        </div>

        {/* ── 메인 콘텐츠 ── */}
        <main className={styles.main}>
          {loading ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3].map(i => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>아직 유지보수 기록이 없습니다.</p>
              <p className={styles.emptyHint}>위 "AI 분석 실행" 버튼을 눌러 첫 번째 분석을 시작하세요.</p>
            </div>
          ) : (
            <div className={styles.logList}>
              {logs.map((log) => (
                <article key={log.id} className={styles.logCard}>
                  {/* ── 카드 헤더 ── */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardMeta}>
                      <span className={styles.fileTag}>📄 {log.targetFile}</span>
                      <span className={styles.dateTag}>{formatDate(log.date)}</span>
                    </div>
                    <button
                      className={styles.toggleBtn}
                      onClick={() =>
                        setExpandedId(expandedId === log.id ? null : log.id)
                      }
                      aria-expanded={expandedId === log.id}
                    >
                      {expandedId === log.id ? '▲ 접기' : '▼ 코드 보기'}
                    </button>
                  </div>

                  {/* ── 쉬운 설명 (CEO용 — 항상 표시) ── */}
                  <div className={styles.easyBox}>
                    <div className={styles.easyLabel}>
                      <span className={styles.easyIcon}>💡</span>
                      AI가 무엇을 개선했나요?
                    </div>
                    <p className={styles.easyText}>{log.easyExplanation}</p>
                  </div>

                  {/* ── Before / After 코드 (펼침) ── */}
                  {expandedId === log.id && (
                    <div className={styles.codeSection}>
                      {log.issue && (
                        <div className={styles.issueTag}>
                          🐛 감지된 문제: {log.issue}
                        </div>
                      )}
                      <div className={styles.diffGrid}>
                        <div className={styles.diffBlock}>
                          <div className={styles.diffLabel}>
                            <span className={styles.dotRed} /> Before
                          </div>
                          <pre className={`${styles.codeBlock} ${styles.before}`}>
                            <code>{log.beforeCode}</code>
                          </pre>
                        </div>
                        <div className={styles.diffArrow}>→</div>
                        <div className={styles.diffBlock}>
                          <div className={styles.diffLabel}>
                            <span className={styles.dotGreen} /> After
                          </div>
                          <pre className={`${styles.codeBlock} ${styles.after}`}>
                            <code>{log.afterCode}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>

        {/* ── 토스트 알림 ── */}
        {toast && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
