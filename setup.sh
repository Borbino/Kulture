#!/bin/bash
# Kulture 프로젝트 빠른 시작 스크립트

echo "🚀 Kulture 프로젝트 설정 시작..."
echo ""

# 1. 환경 변수 파일 생성
if [ ! -f .env.local ]; then
    echo "📝 .env.local 파일 생성 중..."
    cp .env.example .env.local
    echo "✅ .env.local 파일이 생성되었습니다."
    echo ""
    echo "⚠️  중요: .env.local 파일을 열어서 다음 항목을 설정하세요:"
    echo "   - NEXT_PUBLIC_SANITY_PROJECT_ID"
    echo "   - NEXT_PUBLIC_SANITY_DATASET"
    echo "   - SANITY_API_TOKEN"
    echo "   - CRON_SECRET (다음 명령으로 생성: openssl rand -base64 32)"
    echo ""
else
    echo "✅ .env.local 파일이 이미 존재합니다."
    echo ""
fi

# 2. 의존성 설치
echo "📦 의존성 설치 확인 중..."
if [ ! -d "node_modules" ]; then
    echo "📥 npm install 실행 중..."
    npm install
    echo "✅ 의존성 설치 완료!"
else
    echo "✅ 의존성이 이미 설치되어 있습니다."
fi
echo ""

# 3. 코드 품질 검사
echo "🔍 코드 품질 검사 중..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ ESLint 검사 통과!"
else
    echo "⚠️  ESLint 경고가 있습니다."
fi
echo ""

# 4. 테스트 실행
echo "🧪 테스트 실행 중..."
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 모든 테스트 통과!"
else
    echo "⚠️  일부 테스트가 실패했습니다."
fi
echo ""

# 5. 완료
echo "════════════════════════════════════════"
echo "✨ 설정이 완료되었습니다!"
echo "════════════════════════════════════════"
echo ""
echo "다음 단계:"
echo "1. .env.local 파일에 API 키 입력"
echo "2. npm run dev - 개발 서버 시작"
echo "3. npm run build - 프로덕션 빌드"
echo "4. npm start - 프로덕션 서버 시작"
echo ""
echo "📚 자세한 내용은 다음 문서를 참조하세요:"
echo "   - README.md - 프로젝트 개요"
echo "   - docs/SETUP_GUIDE.md - 설정 가이드"
echo "   - UPGRADE_GUIDE.md - 업그레이드 가이드"
echo "   - FINAL_REPORT.md - 작업 완료 보고서"
echo ""
