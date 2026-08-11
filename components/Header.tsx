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
          <SearchAutocomplete />
          <ThemeToggle />
        </div>

        <details className={`mobile-menu ${styles.mobileMenu}`}>
          <summary aria-label="Open navigation"><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <Link href="/search">Search</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
