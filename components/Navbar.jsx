/**
 * Navbar — Premium Magazine-style with Glassmorphism
 * Phase 7 · Kulture Design System
 * Phase 9 · Gamification EXP Badge 변수 동지 연동
 */
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LanguageSwitcher from './LanguageSwitcher';
import { getLevelInfo } from '../lib/gamificationEngine.js';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/',              label: 'Home'    },
  { href: '/trending',      label: 'Trending', badge: 'LIVE' },
  { href: '/categories',    label: 'K-Culture' },
  { href: '/community',     label: 'Community' },
  { href: '/newsletter',    label: 'Newsletter' },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Phase 9 — Mock EXP (350 EXP, Lv.3 K-Pop Fan)
  // 프로덕션에서는 useSession() 세션 유저 데이터로 교체
  const userExp   = 350;
  const levelInfo = getLevelInfo(userExp);

  // Glassmorphism on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [router.asPath]);

  // ESC closes search overlay
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
  }, [router, searchQuery]);

  return (
    <>
      <header className={`${styles.navbar} ${scrolled ? styles.scrolled : styles.transparent}`}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="Kulture Home">
            <span className={styles.logoDot} aria-hidden="true" />
            <span className={styles.logoText}>KULTURE</span>
          </Link>

          {/* Desktop nav links */}
          <nav aria-label="Primary navigation">
            <ul className={styles.navLinks}>
              {NAV_LINKS.map(({ href, label, badge }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${styles.navLink} ${router.pathname === href ? styles.active : ''}`}
                  >
                    {label}
                    {badge && <span className={styles.liveBadge}>{badge}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right controls */}
          <div className={styles.controls}>
            {/* Phase 9 — EXP / Level Badge */}
            <div className={styles.expBadge} title={`${userExp} EXP 누적`}>
              <span className={styles.expBadgeIcon}>{levelInfo.icon}</span>
              <div className={styles.expBadgeInfo}>
                <span className={styles.expBadgeLevel}>Lv.{levelInfo.level} {levelInfo.title}</span>
                <span className={styles.expBadgeExp}>{userExp} EXP</span>
              </div>
            </div>

            {/* Search */}
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Mobile hamburger */}
            <button
              className={styles.hamburger}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <nav className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`} aria-label="Mobile navigation">
        {NAV_LINKS.map(({ href, label, badge }) => (
          <Link key={href} href={href} className={styles.mobileLink}>
            {label}
            {badge && <span className={styles.liveBadge}>{badge}</span>}
          </Link>
        ))}
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className={styles.searchOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className={styles.searchBox}>
            <form onSubmit={handleSearchSubmit}>
              <input
                autoFocus
                type="search"
                className={styles.searchInput}
                placeholder="Search K-Culture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search query"
              />
            </form>
            <p className={styles.searchHint}>Press Enter to search · ESC to close</p>
          </div>
        </div>
      )}
    </>
  );
}
