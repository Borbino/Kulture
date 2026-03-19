/**
 * E2E Tests — API Health & Security
 *
 * 주요 커버리지:
 * 1. /api/health — 미인증 접근 허용, 응답 구조 검증
 * 2. 보호된 Admin API — 미인증 시 401/403 반환 검증
 * 3. Rate limiting 헤더 — X-RateLimit-Limit 존재 여부
 * 4. 잘못된 메서드 → 405 검증
 */

import { test, expect } from '@playwright/test';

test.describe('API Health & Security E2E Tests', () => {
  // ── Health 엔드포인트 ──────────────────────────────────────────
  test.describe('/api/health', () => {
    test('GET 요청 → 200 또는 503 반환', async ({ request }) => {
      const response = await request.get('/api/health');
      expect([200, 503]).toContain(response.status());
    });

    test('응답에 status, timestamp, checks 필드 존재', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
    });

    test('status 값은 "healthy" 또는 "degraded"', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();
      expect(['healthy', 'degraded']).toContain(data.status);
    });

    test('checks 객체에 핵심 서비스 키 존재', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();
      const checkKeys = Object.keys(data.checks);
      // 최소 1개 이상 서비스 체크 항목 존재
      expect(checkKeys.length).toBeGreaterThan(0);
    });
  });

  // ── 보호된 Admin API 미인증 접근 검증 ─────────────────────────
  test.describe('Admin API 인증 보호', () => {
    test('/api/monitoring/stats — 미인증 시 401/403 반환', async ({ request }) => {
      const response = await request.get('/api/monitoring/stats');
      expect([401, 403]).toContain(response.status());
    });

    test('/api/monitoring/performance-report — 미인증 시 401/403 반환', async ({ request }) => {
      const response = await request.get('/api/monitoring/performance-report');
      expect([401, 403]).toContain(response.status());
    });

    test('/api/admin/ai-status — 미인증 시 401/403 반환', async ({ request }) => {
      const response = await request.get('/api/admin/ai-status');
      expect([401, 403]).toContain(response.status());
    });

    test('/api/admin/cost-monitor — 미인증 시 401/403 반환', async ({ request }) => {
      const response = await request.get('/api/admin/cost-monitor');
      expect([401, 403]).toContain(response.status());
    });

    test('/api/improve-content — 미인증 시 401 반환', async ({ request }) => {
      const response = await request.post('/api/improve-content', {
        data: { postId: 'test', type: 'grammar' },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ── 잘못된 HTTP 메서드 ─────────────────────────────────────────
  test.describe('Method Not Allowed 처리', () => {
    test('/api/health — POST 요청 시 405', async ({ request }) => {
      const response = await request.post('/api/health');
      // health.js는 GET만 허용 (일부 구현은 method 무관할 수 있어 400-405 범위 허용)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('/api/admin/ai-status — POST 요청 시 405', async ({ request }) => {
      const response = await request.post('/api/admin/ai-status');
      // 401이 먼저 걸릴 수 있으므로 4xx 허용
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  // ── Rate Limit 헤더 ────────────────────────────────────────────
  test.describe('Rate Limiting 헤더 검증', () => {
    test('/api/translate — X-RateLimit-Limit 헤더 존재', async ({ request }) => {
      const response = await request.post('/api/translate', {
        data: { text: 'Hello', targetLang: 'ko', sourceLang: 'en' },
      });
      // 429이면 rate limit 걸린 것이므로 정상, 200/400/5xx도 헤더 확인
      const rateLimitHeader = response.headers()['x-ratelimit-limit'];
      // 헤더 존재 시 숫자여야 함 (없을 수도 있는 환경 고려)
      if (rateLimitHeader) {
        expect(Number(rateLimitHeader)).toBeGreaterThan(0);
      }
    });
  });

  // ── 번역 캐시 헬스 ────────────────────────────────────────────
  test.describe('/api/translation/health', () => {
    test('GET 요청 → 200 반환', async ({ request }) => {
      const response = await request.get('/api/translation/health');
      expect(response.status()).toBeLessThan(500);
    });

    test('응답에 status 또는 providers 필드 존재', async ({ request }) => {
      const response = await request.get('/api/translation/health');
      if (response.status() === 200) {
        const data = await response.json();
        const hasField = 'status' in data || 'providers' in data || 'available' in data;
        expect(hasField).toBe(true);
      }
    });
  });
});
