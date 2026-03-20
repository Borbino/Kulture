/**
 * DailyMissions — Phase 9 Gamification Widget
 * 글래스모피즘 + 네온 테마, 매일 미션 + CLAIM REWARD UI
 */
import { useState, useEffect } from 'react';
import { getDailyMissions, getLevelInfo } from '../lib/gamificationEngine.js';
import styles from './DailyMissions.module.css';

// 로그인하지 않은 유저를 위한 Mock userId
const MOCK_USER_ID = 'guest-demo';
// 모의 보유 포인트 (로그인 없는 환경에서도 렌더)
const MOCK_EXP = 350;

export default function DailyMissions() {
  const [missions,  setMissions]  = useState([]);
  const [claimed,   setClaimed]   = useState(new Set());
  const [totalExp,  setTotalExp]  = useState(MOCK_EXP);

  const levelInfo = getLevelInfo(totalExp);

  useEffect(() => {
    setMissions(getDailyMissions(MOCK_USER_ID));
  }, []);

  const completedCount = missions.filter(m => m.completed || claimed.has(m.id)).length;

  const pendingReward = missions
    .filter(m => m.completed && !claimed.has(m.id))
    .reduce((s, m) => s + m.reward, 0);

  const handleClaim = (mission) => {
    if (!mission.completed || claimed.has(mission.id)) return;
    setClaimed(prev => new Set([...prev, mission.id]));
    setTotalExp(prev => prev + mission.reward);
  };

  const handleClaimAll = () => {
    const claimable = missions.filter(m => m.completed && !claimed.has(m.id));
    let bonus = 0;
    const next = new Set(claimed);
    claimable.forEach(m => { next.add(m.id); bonus += m.reward; });
    setClaimed(next);
    setTotalExp(prev => prev + bonus);
  };

  return (
    <div className={styles.widget}>
      {/* ── 헤더 ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.widgetIcon}>🎯</span>
          <div>
            <h3 className={styles.widgetTitle}>Daily Missions</h3>
            <p className={styles.widgetSub}>오늘 미션을 완료하고 EXP를 모으세요</p>
          </div>
        </div>
        <div className={styles.expPill}>
          <span className={styles.expIcon}>{levelInfo.icon}</span>
          <span className={styles.expValue}>{totalExp} EXP</span>
        </div>
      </div>

      {/* ── 레벨 프로그레스 ── */}
      <div className={styles.levelRow}>
        <span className={styles.levelLabel}>Lv.{levelInfo.level} {levelInfo.title}</span>
        {levelInfo.nextLevel && (
          <span className={styles.levelNext}>{levelInfo.toNext} EXP 다음 레벨</span>
        )}
      </div>
      <div className={styles.levelBar}>
        <div className={styles.levelFill} style={{ width: `${levelInfo.progress}%` }} />
      </div>

      {/* ── 오늘 완료 현황 ── */}
      <div className={styles.summary}>
        <span className={styles.summaryText}>
          <strong>{completedCount}</strong> / {missions.length} 완료
        </span>
        {pendingReward > 0 && (
          <button className={styles.claimAllBtn} onClick={handleClaimAll}>
            <span className={styles.claimGlow} />
            +{pendingReward} EXP CLAIM ALL
          </button>
        )}
      </div>

      {/* ── 미션 리스트 ── */}
      <div className={styles.missionList}>
        {missions.map((mission) => {
          const isClaimed = claimed.has(mission.id);
          const canClaim  = mission.completed && !isClaimed;
          const pct       = Math.min((mission.progress / mission.target) * 100, 100);

          return (
            <div
              key={mission.id}
              className={`${styles.missionCard} ${isClaimed ? styles.done : ''}`}
            >
              <div className={styles.missionLeft}>
                <span className={styles.missionIcon}>{mission.icon}</span>
                <div className={styles.missionBody}>
                  <div className={styles.missionTop}>
                    <span className={styles.missionTitle}>{mission.title}</span>
                    <span className={`${styles.diffBadge} ${styles[mission.difficulty]}`}>
                      {mission.difficulty}
                    </span>
                  </div>
                  <p className={styles.missionDesc}>{mission.description}</p>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.progressText}>{mission.progress}/{mission.target}</span>
                  </div>
                </div>
              </div>

              <div className={styles.missionRight}>
                {isClaimed ? (
                  <span className={styles.claimed}>✅ DONE</span>
                ) : canClaim ? (
                  <button className={styles.claimBtn} onClick={() => handleClaim(mission)}>
                    <span className={styles.claimGlow} />
                    +{mission.reward}<br />
                    <small>CLAIM</small>
                  </button>
                ) : (
                  <span className={styles.rewardPending}>+{mission.reward} EXP</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 모든 미션 완료 배너 ── */}
      {completedCount === missions.length && missions.length > 0 && claimed.size === completedCount && (
        <div className={styles.allDoneBanner}>
          <span>🎉 오늘 모든 미션 완료! 내일 또 돌아오세요.</span>
        </div>
      )}
    </div>
  );
}
