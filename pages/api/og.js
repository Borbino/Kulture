/**
 * Dynamic OpenGraph Image API
 * [경로] /api/og?title=...&subtitle=...&category=...
 * [목적] 트렌드/VIP/게시물 페이지용 동적 OG 이미지 생성
 * [런타임] Edge (Vercel @vercel/og / next/og)
 */

import { ImageResponse } from 'next/og'

export const config = {
  runtime: 'edge',
}

const SITE_NAME = 'Kulture'
const THEME_PRIMARY = '#667eea'
const THEME_SECONDARY = '#764ba2'

export default async function handler(req) {
  const { searchParams } = new URL(req.url)

  const title = (searchParams.get('title') || 'K-Culture 트렌드 허브').slice(0, 60)
  const subtitle = (searchParams.get('subtitle') || '실시간 이슈 · VIP 알림 · 글로벌 팬덤').slice(0, 80)
  const category = searchParams.get('category') || ''
  const emoji = searchParams.get('emoji') || '🎤'

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${THEME_PRIMARY} 0%, ${THEME_SECONDARY} 100%)`,
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }}
          />

          {/* Top label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '6px 16px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {SITE_NAME}
            </div>
            {category && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {category}
              </div>
            )}
          </div>

          {/* Emoji */}
          <div style={{ fontSize: '72px', marginBottom: '24px', lineHeight: '1' }}>
            {emoji}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: '900',
              color: '#fff',
              lineHeight: '1.2',
              marginBottom: '20px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.82)',
              fontWeight: '400',
              lineHeight: '1.5',
              maxWidth: '800px',
            }}
          >
            {subtitle}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '48px',
              left: '60px',
              right: '60px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '16px',
              }}
            >
              kulture.app
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              {['🇰🇷', '🇯🇵', '🇨🇳', '🌍'].map((flag, i) => (
                <span key={i} style={{ fontSize: '20px' }}>{flag}</span>
              ))}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch {
    // Fallback: redirect to a static OG image
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/icons/icon-512x512.png',
      },
    })
  }
}
