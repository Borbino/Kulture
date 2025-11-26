/**
 * Core Web Vitals Monitoring
 * Track LCP, FID, CLS and report to analytics
 */

import { trackPerformance } from './analytics';

/**
 * Web Vitals 측정 및 리포팅
 */
export function reportWebVitals(metric) {
  // Core Web Vitals
  if (['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'].includes(metric.name)) {
    // Send to analytics
    trackPerformance(metric.name, metric.value);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send to monitoring service (e.g., Vercel Analytics, Datadog)
    if (typeof window !== 'undefined' && window.va) {
      window.va('event', {
        name: `web-vital-${metric.name}`,
        value: metric.value,
        rating: metric.rating,
      });
    }
  }

  // Custom metrics
  if (metric.name === 'Next.js-hydration') {
    trackPerformance('Hydration', metric.value);
  }

  if (metric.name === 'Next.js-route-change-to-render') {
    trackPerformance('Route-Change', metric.value);
  }

  if (metric.name === 'Next.js-render') {
    trackPerformance('Render', metric.value);
  }
}

/**
 * 커스텀 성능 측정
 */
export function measurePerformance(name, startMark, endMark) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      trackPerformance(name, measure.duration);
      return measure.duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
  return null;
}

/**
 * 리소스 타이밍 분석
 */
export function analyzeResourceTiming() {
  if (typeof window !== 'undefined' && window.performance) {
    const resources = window.performance.getEntriesByType('resource');
    
    const analysis = {
      total: resources.length,
      scripts: 0,
      stylesheets: 0,
      images: 0,
      fonts: 0,
      totalSize: 0,
      slowResources: [],
    };

    resources.forEach((resource) => {
      const type = resource.initiatorType;
      const duration = resource.duration;

      // Count by type
      if (type === 'script') analysis.scripts++;
      else if (type === 'css' || type === 'link') analysis.stylesheets++;
      else if (type === 'img') analysis.images++;
      else if (type === 'font') analysis.fonts++;

      // Track slow resources (> 1s)
      if (duration > 1000) {
        analysis.slowResources.push({
          name: resource.name,
          duration: Math.round(duration),
          type,
        });
      }

      // Total transfer size
      if (resource.transferSize) {
        analysis.totalSize += resource.transferSize;
      }
    });

    return analysis;
  }

  return null;
}

/**
 * Long Task 감지
 */
export function observeLongTasks() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[Long Task]', {
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime),
            });

            trackPerformance('Long-Task', entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      return observer;
    } catch (error) {
      console.warn('Long task observation not supported');
    }
  }

  return null;
}
