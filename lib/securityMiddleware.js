/**
 * Security Middleware
 * CSP, CORS, XSS, CSRF protection
 */

/**
 * Content Security Policy (CSP) 헤더
 */
export function applyCSP(req, res, next) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.kulture.com https://www.google-analytics.com",
    "frame-src 'self' https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  if (typeof next === 'function') {
    next();
  }
}

/**
 * CORS 설정
 */
export function applyCORS(req, res, next) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://kulture.com',
    'https://www.kulture.com',
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Admin-Secret, X-API-Key'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (typeof next === 'function') {
    next();
  }
}

/**
 * Security headers
 */
export function applySecurityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  if (typeof next === 'function') {
    next();
  }
}

/**
 * CSRF 토큰 검증
 */
export function validateCSRF(req, res) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.cookies?.csrfToken;

    if (!csrfToken || csrfToken !== sessionToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }

  return true;
}

/**
 * XSS 방어 (입력 검증)
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SQL Injection 방어 (기본 패턴 감지)
 */
export function detectSQLInjection(input) {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
    /--/,
    /;/,
    /\/\*/,
    /\*\//,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * 통합 보안 미들웨어
 */
export function securityMiddleware(handler) {
  return async (req, res) => {
    // Apply security headers
    applySecurityHeaders(req, res);
    applyCORS(req, res);
    applyCSP(req, res);

    // CSRF validation for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Skip CSRF for API routes with API key
      if (!req.headers['x-api-key']) {
        const csrfValid = validateCSRF(req, res);
        if (csrfValid !== true) return;
      }
    }

    // Execute handler
    return handler(req, res);
  };
}

export default securityMiddleware;
