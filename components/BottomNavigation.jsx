/**
 * BottomNavigation Component
 * [목적] iOS/Android 스타일 모바일 하단 탭바
 *        모바일 기기에서만 렌더링됨 (데스크탑 숨김)
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import styles from './BottomNavigation.module.css'

const NAV_ITEMS = [
  {
    href: '/',
    label: '홈',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/trends',
    label: '트렌드',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/communities',
    label: '커뮤니티',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: '검색',
    icon: (_active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: '프로필',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNavigation() {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <nav className={styles.nav} aria-label="하단 내비게이션">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? router.pathname === '/'
            : router.pathname.startsWith(item.href)

        // 프로필 탭: 비로그인 시 signin 페이지로
        const href =
          item.href === '/profile' && !session
            ? '/auth/signin?callbackUrl=/profile'
            : item.href

        return (
          <Link
            key={item.href}
            href={href}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon}>{item.icon(isActive)}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
