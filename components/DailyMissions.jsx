import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './DailyMissions.module.css';

export default function DailyMissions() {
  const { data: session } = useSession();
  const [missions, setMissions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchMissions();
    }
  }, [session]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gamification/missions');
      const data = await res.json();
      setMissions(data.missions || []);
      setStreak(data.streak || 0);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading missions...</div>
      </div>
    );
  }

  const completedCount = missions.filter(m => m.isCompleted).length;
  const totalPoints = missions
    .filter(m => m.isCompleted)
    .reduce((sum, m) => sum + m.rewardPoints, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🎯</span>
          <h2>Daily Missions</h2>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Completed</div>
            <div className={styles.statValue}>
              {completedCount}/{missions.length}
            </div>
          </div>
          
          <div className={styles.stat}>
            <div className={styles.statLabel}>Today's Points</div>
            <div className={styles.statValue}>+{totalPoints}</div>
          </div>
          
          <div className={styles.stat}>
            <div className={styles.statLabel}>🔥 Streak</div>
            <div className={styles.statValue}>{streak} days</div>
          </div>
        </div>
      </div>

      <div className={styles.missions}>
        {missions.map((mission) => (
          <div
            key={mission._id}
            className={`${styles.mission} ${mission.isCompleted ? styles.completed : ''}`}
          >
            <div className={styles.missionIcon}>{mission.icon}</div>
            
            <div className={styles.missionContent}>
              <div className={styles.missionHeader}>
                <h3 className={styles.missionTitle}>{mission.title}</h3>
                <span
                  className={styles.difficulty}
                  style={{ background: getDifficultyColor(mission.difficulty) }}
                >
                  {mission.difficulty}
                </span>
              </div>
              
              <p className={styles.missionDesc}>{mission.description}</p>
              
              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${(mission.userProgress / mission.targetCount) * 100}%`,
                    }}
                  />
                </div>
                <span className={styles.progressText}>
                  {mission.userProgress}/{mission.targetCount}
                </span>
              </div>
            </div>
            
            <div className={styles.reward}>
              {mission.isCompleted ? (
                <div className={styles.completedBadge}>✅</div>
              ) : (
                <>
                  <div className={styles.rewardPoints}>+{mission.rewardPoints}pt</div>
                  {mission.rewardBadge && (
                    <div className={styles.rewardBadge} title={mission.rewardBadge.name}>
                      {mission.rewardBadge.icon}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {missions.length === 0 && (
        <div className={styles.empty}>
          <p>No missions available today</p>
        </div>
      )}
    </div>
  );
}
