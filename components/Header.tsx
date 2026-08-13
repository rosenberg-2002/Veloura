import Link from "next/link";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./Header.module.css";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/genres", label: "Genre" },
  { href: "/productions", label: "Productions" },
  { href: "/people", label: "Actor / Actress" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className={`header-inner ${styles.headerInner}`}>
        <Link className="brand" href="/" aria-label="Veloura home">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>Veloura</span>
        </Link>

        <nav className={`desktop-nav ${styles.desktopNav}`} aria-label="Primary navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>

        <div className={`header-tools ${styles.tools}`}>
          <Link className={styles.mobileSearchBtn} href="/search" aria-label="Search">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18">
              <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <line x1="15.5" y1="15.5" x2="22" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
          <div className={`${styles.desktopSearch} header-autocomplete`}>
            <SearchAutocomplete />
          </div>
          <span className="header-theme-toggle"><ThemeToggle /></span>
        </div>

        <details className={`mobile-menu ${styles.mobileMenu}`}>
          <summary aria-label="Open navigation"><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            <div className={`${styles.mobileNavSearch} header-autocomplete`}>
              <SearchAutocomplete />
            </div>
            <div className={styles.mobileNavDivider} />
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <div className={styles.mobileNavDivider} />
            <div className={styles.mobileNavTheme}>
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
