/**
 * aiSentiment.js 테스트
 * - detectLanguage: 언어 감지
 * - analyzeSentiment: AI 우선 + heuristic 폴백
 * - detectSpam: 스팸 감지
 * - analyzeCommentQuality: 댓글 품질
 * - analyzePostQuality: 게시글 품질
 */

import { detectLanguage, analyzeSentiment, detectSpam, analyzeCommentQuality, analyzePostQuality } from '../lib/aiSentiment.js';

// generateWithBestModel 목킹: 항상 실패시켜 heuristic 폴백 경로 커버
jest.mock('../lib/aiModelManager.js', () => ({
  generateWithBestModel: jest.fn().mockRejectedValue(new Error('mock AI unavailable')),
}));

describe('detectLanguage', () => {
  test('한국어 감지', () => {
    expect(detectLanguage('안녕하세요 반갑습니다')).toBe('ko');
  });
  test('영어 감지', () => {
    expect(detectLanguage('hello world')).toBe('en');
  });
  test('일본어 감지', () => {
    expect(detectLanguage('こんにちは、世界')).toBe('ja');
  });
  test('중국어 감지', () => {
    expect(detectLanguage('你好世界')).toBe('zh');
  });
});

describe('analyzeSentiment (heuristic fallback)', () => {
  test('긍정 텍스트 → positive', async () => {
    const result = await analyzeSentiment('정말 좋아요 최고입니다 감사합니다');
    expect(result.sentiment).toBe('positive');
    expect(result).toHaveProperty('detectedLanguage');
    expect(result).toHaveProperty('confidence');
  });

  test('부정 텍스트 → negative', async () => {
    const result = await analyzeSentiment('최악이에요 정말 싫어 별로 실망했어요');
    expect(result.sentiment).toBe('negative');
  });

  test('중립 텍스트 → neutral', async () => {
    const result = await analyzeSentiment('오늘 날씨가 흐립니다');
    expect(result.sentiment).toBe('neutral');
  });

  test('독성 텍스트 → isToxic: true', async () => {
    const result = await analyzeSentiment('죽어버려 꺼져');
    expect(result.isToxic).toBe(true);
  });

  test('영어 긍정 → positive', async () => {
    // heuristic: positiveScore > negativeScore + 2 → 3개 이상 필요
    const result = await analyzeSentiment('This is amazing, wonderful and excellent!', 'en');
    expect(result.sentiment).toBe('positive');
    expect(result.detectedLanguage).toBe('en');
  });

  test('결과 구조 검증', async () => {
    const result = await analyzeSentiment('테스트 텍스트');
    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('isToxic');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('provider');
    expect(['positive', 'negative', 'neutral']).toContain(result.sentiment);
  });
});

describe('detectSpam', () => {
  test('정상 댓글 → isSpam: false', () => {
    const result = detectSpam('정말 좋은 글이네요. 감사합니다.');
    expect(result.isSpam).toBe(false);
  });

  test('URL 포함 → 스팸 점수 증가', () => {
    const result = detectSpam('지금 바로 클릭하세요 https://spam.example.com 무료 당첨');
    expect(result.score).toBeGreaterThan(0);
  });

  test('전화번호 포함 → 스팸 점수 증가', () => {
    const result = detectSpam('연락주세요 010-1234-5678 광고입니다');
    expect(result.score).toBeGreaterThan(0);
  });

  test('반복 문자 → 스팸 점수 증가', () => {
    const result = detectSpam('aaaaaaaaaa');
    expect(result.score).toBeGreaterThan(0);
  });

  test('결과 구조 검증', () => {
    const result = detectSpam('테스트');
    expect(result).toHaveProperty('isSpam');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('analyzeCommentQuality', () => {
  test('좋은 댓글 → 높은 점수', async () => {
    const result = await analyzeCommentQuality('정말 유익한 글이네요. 이 부분에서 많은 것을 배웠습니다. 감사합니다!');
    expect(result.score).toBeGreaterThan(50);
    expect(result.recommendations.needsModeration).toBe(false);
  });

  test('스팸 댓글 → 낮은 점수 + moderation 필요', async () => {
    const result = await analyzeCommentQuality('클릭 무료 당첨 https://spam.com');
    expect(result.isSpam).toBe(true);
    expect(result.recommendations.needsModeration).toBe(true);
  });

  test('너무 짧은 댓글 → 낮은 점수', async () => {
    const result = await analyzeCommentQuality('ㅋ');
    expect(result.score).toBeLessThan(50);
  });

  test('결과 구조 검증', async () => {
    const result = await analyzeCommentQuality('일반 댓글입니다');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('isToxic');
    expect(result).toHaveProperty('isSpam');
    expect(result).toHaveProperty('recommendations');
    expect(result.recommendations).toHaveProperty('needsModeration');
    expect(result.recommendations).toHaveProperty('autoApprove');
  });
});

describe('analyzePostQuality', () => {
  test('좋은 게시글 → 높은 점수', async () => {
    const result = await analyzePostQuality(
      'K-POP 최신 트렌드 분석 2026',
      '최근 K-POP 시장은 놀라운 성장을 보이고 있습니다. 아이돌 그룹들이 글로벌 시장에서 큰 성공을 거두고 있으며, 특히 동남아시아와 북미 시장에서 폭발적인 인기를 보이고 있습니다. 이번 글에서는 2026년 K-POP 트렌드를 자세히 살펴보겠습니다.',
      ['k-pop', '트렌드', '2026']
    );
    expect(result.score).toBeGreaterThan(50);
    expect(result.recommendations.needsModeration).toBe(false);
  });

  test('너무 짧은 제목 → 낮은 점수', async () => {
    const result = await analyzePostQuality('제목', '어쩌고 저쩌고이렇게됩니다');
    expect(result.score).toBeLessThan(70);
  });

  test('결과 구조 검증', async () => {
    const result = await analyzePostQuality('테스트 제목입니다', '테스트 내용입니다 충분히 긴 텍스트');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('isToxic');
    expect(result).toHaveProperty('isSpam');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('recommendations');
    expect(result.metrics).toHaveProperty('titleLength');
    expect(result.metrics).toHaveProperty('contentLength');
  });
});
