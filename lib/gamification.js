/**
 * Gamification Enhancement
 * Translation contribution-based level system, badges, and leaderboard
 */

const LEVEL_THRESHOLDS = [0, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const BADGES = {
  first_translation: { name: 'First Steps', icon: '🌱', requirement: 1 },
  polyglot: { name: 'Polyglot', icon: '🌍', requirement: '5 languages' },
  quality_master: { name: 'Quality Master', icon: '⭐', requirement: 'avg quality > 90%' },
  speed_demon: { name: 'Speed Demon', icon: '⚡', requirement: '100 translations in 24h' },
  community_hero: { name: 'Community Hero', icon: '🏆', requirement: '50 approved suggestions' },
  consistency_king: { name: 'Consistency King', icon: '📅', requirement: '30 day streak' },
};

export function calculateLevel(translationCount) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (translationCount >= LEVEL_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }
  return {
    level,
    current: translationCount,
    next: LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1],
    progress: level < LEVEL_THRESHOLDS.length - 1
      ? ((translationCount - LEVEL_THRESHOLDS[level]) / (LEVEL_THRESHOLDS[level + 1] - LEVEL_THRESHOLDS[level])) * 100
      : 100,
  };
}

export function checkBadges(userStats) {
  const earnedBadges = [];
  
  if (userStats.translationCount >= BADGES.first_translation.requirement) {
    earnedBadges.push('first_translation');
  }
  
  if (userStats.languageCount >= 5) {
    earnedBadges.push('polyglot');
  }
  
  if (userStats.avgQuality > 90) {
    earnedBadges.push('quality_master');
  }
  
  if (userStats.approvedSuggestions >= 50) {
    earnedBadges.push('community_hero');
  }
  
  if (userStats.currentStreak >= 30) {
    earnedBadges.push('consistency_king');
  }
  
  return earnedBadges.map(id => ({ id, ...BADGES[id] }));
}

export function generateLeaderboard(users) {
  return users
    .map(user => ({
      ...user,
      score: user.translationCount * 10 + user.approvedSuggestions * 50 + user.avgQuality,
      level: calculateLevel(user.translationCount),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
}

export default { calculateLevel, checkBadges, generateLeaderboard, BADGES, LEVEL_THRESHOLDS };
