import { test, expect } from '@playwright/test';

test.describe('Translation Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display language switcher', async ({ page }) => {
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    await expect(languageSwitcher).toBeVisible({ timeout: 10000 });
  });

  test('should translate content to Korean', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find and click language switcher
    const languageSwitcher = page.locator('select, button').filter({ hasText: /language|언어|lang/i }).first();
    
    if (await languageSwitcher.count() > 0) {
      await languageSwitcher.click();
      
      // Select Korean
      const koreanOption = page.locator('text=/한국어|Korean|ko/i').first();
      if (await koreanOption.count() > 0) {
        await koreanOption.click();
        
        // Wait for translation
        await page.waitForTimeout(1000);
        
        // Check if URL or content changed to Korean
        const url = page.url();
        expect(url).toMatch(/\/ko|locale=ko/);
      }
    }
  });

  test('should translate post content via API', async ({ page, request }) => {
    const response = await request.post('/api/translate', {
      data: {
        text: 'Hello, World!',
        targetLang: 'ko',
        sourceLang: 'en',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('translatedText');
    expect(data.translatedText).toBeTruthy();
  });

  test('should cache translations', async ({ page, request }) => {
    const text = 'Test translation for caching';
    
    // First request
    const response1 = await request.post('/api/translate', {
      data: { text, targetLang: 'ko', sourceLang: 'en' },
    });
    const data1 = await response1.json();
    
    // Second request (should be cached)
    const response2 = await request.post('/api/translate', {
      data: { text, targetLang: 'ko', sourceLang: 'en' },
    });
    const data2 = await response2.json();
    
    expect(data1.translatedText).toBe(data2.translatedText);
    expect(data2.cached).toBe(true);
  });

  test('should handle translation errors gracefully', async ({ page, request }) => {
    const response = await request.post('/api/translate', {
      data: {
        text: '',
        targetLang: 'invalid',
        sourceLang: 'en',
      },
    });

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should support batch translation', async ({ page, request }) => {
    const response = await request.post('/api/translate', {
      data: {
        texts: ['Hello', 'World', 'Translation'],
        targetLang: 'ko',
        sourceLang: 'en',
        batch: true,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('translations');
    expect(Array.isArray(data.translations)).toBeTruthy();
    expect(data.translations.length).toBe(3);
  });

  test('should detect language automatically', async ({ page, request }) => {
    const response = await request.post('/api/translation/detect', {
      data: {
        text: '안녕하세요, 세계!',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('detectedLanguage');
    expect(data.detectedLanguage).toBe('ko');
  });

  test('should submit translation suggestion', async ({ page, request }) => {
    const response = await request.post('/api/translation/suggest', {
      data: {
        originalText: 'Hello',
        suggestedTranslation: '안녕하세요 (더 자연스러운 번역)',
        targetLang: 'ko',
        sourceLang: 'en',
        reason: 'More natural expression',
      },
    });

    expect(response.status()).toBeLessThan(500);
  });

  test('should load translation queue for admin', async ({ page }) => {
    // Navigate to admin page
    await page.goto('/admin/translations');
    
    // Check for authentication or redirect
    const url = page.url();
    expect(url).toMatch(/admin|login|auth/);
  });

  test('should measure Core Web Vitals during translation', async ({ page }) => {
    await page.goto('/');
    
    // Measure LCP
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(4000); // LCP should be under 4s
  });
});
