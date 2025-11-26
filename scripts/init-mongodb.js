#!/usr/bin/env node

/**
 * MongoDB 인덱스 초기화 스크립트
 * 프로덕션 배포 전 한 번 실행
 * 
 * Usage: node scripts/init-mongodb.js
 */

const { createTranslationSuggestionIndexes } = require('../lib/translationSuggestions');

async function initializeMongoDB() {
  console.log('🚀 MongoDB 인덱스 초기화 시작...\n');
  
  try {
    // Translation suggestions 인덱스 생성
    console.log('📝 Translation suggestions 인덱스 생성 중...');
    await createTranslationSuggestionIndexes();
    console.log('✅ Translation suggestions 인덱스 생성 완료\n');
    
    console.log('✨ MongoDB 초기화 완료!');
    console.log('\n다음 단계:');
    console.log('1. Vercel에 환경 변수 설정');
    console.log('2. npm run build로 빌드 확인');
    console.log('3. Vercel에 배포');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB 초기화 실패:', error.message);
    console.error('\n문제 해결:');
    console.error('1. MONGODB_URI가 .env.local에 설정되어 있는지 확인');
    console.error('2. MongoDB Atlas 네트워크 액세스 설정 확인');
    console.error('3. 데이터베이스 권한 확인');
    
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  initializeMongoDB();
}

module.exports = initializeMongoDB;
