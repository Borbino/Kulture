/**
 * Footer — Minimal Magazine Style
 * Phase 7 · Kulture Design System
 */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SUPPORTED_LANGUAGES } from '../lib/languages.js';
import styles from './Footer.module.css';

const FOOTER_LINKS = {
  discover: {
    title: 'Discover',
    links: [
      { href: '/trending',   label: 'Trending'   },
      { href: '/categories', label: 'K-Culture'  },
      { href: '/community',  label: 'Community'  },
      { href: '/newsletter', label: 'Newsletter' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { href: '/about',   label: 'About'   },
      { href: '/careers', label: 'Careers' },
      { href: '/advertise', label: 'Advertise' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { href: '/docs/PRIVACY_POLICY.md',   label: 'Privacy Policy' },
      { href: '/docs/COPYRIGHT_POLICY.md', label: 'Copyright'      },
      { href: '/docs/CRAWLER_POLICY.md',   label: 'Crawler Policy' },
      { href: '/sitemap.xml',              label: 'Sitemap'        },
    ],
  },
};

const SOCIAL_LINKS = [
  {
    label: 'X (Twitter)',
    href: 'https://twitter.com/kulture_net',
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.262 5.636 5.902-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/kulture.net',
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@kulture',
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@kulture',
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const router = useRouter();
  const year = new Date().getFullYear();
  const currentLocale = router.locale || 'ko';
  const currentLangName = SUPPORTED_LANGUAGES?.[currentLocale] || currentLocale.toUpperCase();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Top */}
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logoText}>KULTURE</div>
            <p className={styles.tagline}>
              Your premier destination for K-Pop, K-Drama, K-Beauty, and all things Korean culture — powered by AI, curated for the world.
            </p>
            <div className={styles.socialLinks}>
              {SOCIAL_LINKS.map(({ label, href, svg }) => (
                <a
                  key={label}
                  href={href}
                  className={styles.socialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(FOOTER_LINKS).map(({ title, links }) => (
            <div key={title} className={styles.column}>
              <p className={styles.columnTitle}>{title}</p>
              <ul className={styles.columnLinks}>
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        {/* Bottom */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {year} <strong>Kulture.net</strong> · All rights reserved · {currentLangName}
          </p>
          <nav className={styles.legalLinks} aria-label="Legal">
            <Link href="/docs/PRIVACY_POLICY.md">Privacy</Link>
            <Link href="/docs/COPYRIGHT_POLICY.md">Terms</Link>
            <Link href="/sitemap.xml">Sitemap</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
