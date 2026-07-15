import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">V</span>
            <span>Veloura</span>
          </Link>
          <p>Stories worth the dark.</p>
        </div>
        <div className="footer-links">
          <Link href="/genres">Genres</Link>
          <Link href="/productions">Productions</Link>
          <Link href="/people">People</Link>
          <Link href="/search">Search</Link>
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a>
        </div>
      </div>
      <div className="footer-legal">
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p>Movie data and imagery © their respective owners.</p>
      </div>
    </footer>
  );
}
