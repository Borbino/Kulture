/**
 * AI 감정 분석 시스템
 * - 댓글 감정 분석 (긍정/부정/중립)
 * - 독성 콘텐츠 감지
 * - 스팸 감지
 */

/**
 * 간단한 감정 분석 (한글/영어)
 * 실제 프로덕션에서는 OpenAI, Google Natural Language API, 또는 한국어 감정 분석 모델 사용 권장
 */
export function analyzeSentiment(text) {
  const content = text.toLowerCase();

  // 긍정 키워드
  const positiveWords = [
    '좋아', '최고', '훌륭', '멋지', '완벽', '감동', '행복', '사랑', '예쁘', '아름답',
    '고마', '감사', '축하', '대단', '놀라', '신나', '재밌', '웃겨', '즐거',
    'good', 'great', 'excellent', 'amazing', 'perfect', 'wonderful', 'love', 'beautiful',
    'thank', 'happy', 'joy', 'awesome', 'fantastic', 'brilliant'
  ];

  // 부정 키워드
  const negativeWords = [
    '싫어', '최악', '별로', '실망', '화나', '짜증', '속상', '슬프', '우울', '미워',
    '나쁘', '더러', '역겨', '끔찍', '무서', '답답', '불편', '지겹',
    'bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'disappointed', 'horrible',
    'disgusting', 'annoying', 'frustrating', 'boring', 'poor', 'worst'
  ];

  // 독성 키워드
  const toxicWords = [
    '죽어', '꺼져', '병신', '미친', '씨발', '개새', '좆', '니미', '지랄',
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'idiot', 'stupid', 'dumb'
  ];

  let positiveScore = 0;
  let negativeScore = 0;
  let toxicScore = 0;

  // 키워드 매칭
  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = content.match(regex);
    if (matches) positiveScore += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = content.match(regex);
    if (matches) negativeScore += matches.length;
  });

  toxicWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = content.match(regex);
    if (matches) toxicScore += matches.length * 3; // 독성 키워드는 가중치 높게
  });

  // 감정 판단
  let sentiment = 'neutral';
  if (positiveScore > negativeScore + 2) {
    sentiment = 'positive';
  } else if (negativeScore > positiveScore + 2) {
    sentiment = 'negative';
  }

  // 독성 판단
  const isToxic = toxicScore > 2;

  // 점수 정규화 (0-1 범위)
  const totalScore = positiveScore + negativeScore + toxicScore || 1;
  const normalized = {
    positive: positiveScore / totalScore,
    negative: negativeScore / totalScore,
    toxic: toxicScore / totalScore,
  };

  return {
    sentiment, // 'positive', 'negative', 'neutral'
    isToxic,
    scores: {
      positive: positiveScore,
      negative: negativeScore,
      toxic: toxicScore,
    },
    normalized,
    confidence: Math.abs(positiveScore - negativeScore) / totalScore,
  };
}

/**
 * 스팸 감지
 */
export function detectSpam(text, userPostCount = 0, userLevel = 1) {
  const content = text.toLowerCase();
  let spamScore = 0;

  // 스팸 패턴 체크
  const spamPatterns = [
    /https?:\/\/[^\s]+/gi, // URL 포함
    /\d{3}-\d{4}-\d{4}/g, // 전화번호
    /[가-힣]{2,}\s*\d+원/, // 가격 정보
    /클릭|광고|홍보|이벤트|할인|무료|당첨/gi, // 스팸 키워드
    /(.)\1{4,}/g, // 같은 문자 5번 이상 반복
  ];

  spamPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      spamScore += matches.length * 2;
    }
  });

  // 특수문자 과다 사용
  const specialChars = content.match(/[!@#$%^&*()_+=[\]{};':"\\|,.<>?]/g);
  if (specialChars && specialChars.length > 10) {
    spamScore += 3;
  }

  // 전체 대문자 (영어)
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (upperCaseRatio > 0.5 && content.length > 20) {
    spamScore += 2;
  }

  // 신규 사용자는 스팸 가능성 높음
  if (userPostCount < 5 || userLevel < 2) {
    spamScore += 1;
  }

  const isSpam = spamScore >= 5;

  return {
    isSpam,
    score: spamScore,
    confidence: Math.min(spamScore / 10, 1),
  };
}

/**
 * 댓글 품질 분석
 */
export function analyzeCommentQuality(comment, postContent = '') {
  const sentiment = analyzeSentiment(comment);
  const spam = detectSpam(comment);

  // 댓글 길이
  const length = comment.length;
  const wordCount = comment.split(/\s+/).length;

  // 품질 점수 계산
  let qualityScore = 50; // 기본 50점

  // 긍정적인 감정 (+10)
  if (sentiment.sentiment === 'positive') qualityScore += 10;

  // 부정적이거나 독성 (-20)
  if (sentiment.sentiment === 'negative' || sentiment.isToxic) qualityScore -= 20;

  // 스팸 (-30)
  if (spam.isSpam) qualityScore -= 30;

  // 적절한 길이 (20-500자) (+10)
  if (length >= 20 && length <= 500) qualityScore += 10;

  // 너무 짧음 (-10)
  if (length < 10) qualityScore -= 10;

  // 단어 수 (5개 이상) (+5)
  if (wordCount >= 5) qualityScore += 5;

  // 게시글 내용과 관련성 (간단한 키워드 매칭)
  if (postContent) {
    const postWords = postContent.toLowerCase().split(/\s+/).slice(0, 50);
    const commentWords = comment.toLowerCase().split(/\s+/);
    const overlap = commentWords.filter(word => postWords.includes(word)).length;
    if (overlap > 3) qualityScore += 10;
  }

  // 0-100 범위로 제한
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    score: qualityScore,
    sentiment: sentiment.sentiment,
    isToxic: sentiment.isToxic,
    isSpam: spam.isSpam,
    length,
    wordCount,
    recommendations: {
      needsModeration: sentiment.isToxic || spam.isSpam || qualityScore < 30,
      autoApprove: qualityScore >= 70 && !sentiment.isToxic && !spam.isSpam,
    },
  };
}

/**
 * 게시글 품질 분석
 */
export function analyzePostQuality(title, content, tags = []) {
  let qualityScore = 50;

  // 제목 길이 (10-100자)
  if (title.length >= 10 && title.length <= 100) {
    qualityScore += 10;
  } else if (title.length < 10) {
    qualityScore -= 15;
  }

  // 내용 길이 (100자 이상)
  if (content.length >= 100) {
    qualityScore += 15;
  } else if (content.length < 50) {
    qualityScore -= 10;
  }

  // 태그 개수 (1-5개)
  if (tags.length >= 1 && tags.length <= 5) {
    qualityScore += 10;
  }

  // 감정 및 스팸 분석
  const contentSentiment = analyzeSentiment(content);
  const contentSpam = detectSpam(content);

  if (contentSentiment.isToxic) qualityScore -= 30;
  if (contentSpam.isSpam) qualityScore -= 40;

  // 문장 구조 (문장 개수)
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) qualityScore += 10;

  // 0-100 범위로 제한
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    score: qualityScore,
    sentiment: contentSentiment.sentiment,
    isToxic: contentSentiment.isToxic,
    isSpam: contentSpam.isSpam,
    metrics: {
      titleLength: title.length,
      contentLength: content.length,
      tagCount: tags.length,
      sentenceCount: sentences.length,
    },
    recommendations: {
      needsModeration: contentSentiment.isToxic || contentSpam.isSpam || qualityScore < 40,
      autoApprove: qualityScore >= 70 && !contentSentiment.isToxic && !contentSpam.isSpam,
      suggestions: [],
    },
  };
}
