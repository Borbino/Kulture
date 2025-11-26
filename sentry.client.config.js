// Sentry configuration for Next.js
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  environment: process.env.NODE_ENV,

  // Customize error filtering
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filter out known issues
    const error = hint.originalException;
    if (error && error.message) {
      // Ignore network errors
      if (error.message.match(/network|fetch|timeout/i)) {
        return null;
      }
      
      // Ignore cancelled requests
      if (error.message.match(/cancel|abort/i)) {
        return null;
      }
    }

    return event;
  },

  // Enhanced error tracking
  integrations: [
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/kulture\.com/],
    }),
    new Sentry.Replay({
      // Mask all text and input content
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session Replay sample rate
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Facebook errors
    'fb_xd_fragment',
    // Network errors that we can't control
    'NetworkError',
    'Non-Error promise rejection captured',
  ],
});
