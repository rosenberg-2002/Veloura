import Link from "next/link";
import { MovieRail } from "@/components/MovieRail";
import { StatusPanel } from "@/components/StatusPanel";
import { getMoviePage, imageUrl, movieGenres, movieYear, rating } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pages = await Promise.all([
    getMoviePage("/trending/movie/week"),
    getMoviePage("/movie/popular"),
    getMoviePage("/movie/top_rated"),
    getMoviePage("/movie/now_playing", { region: "US" }),
  ]).catch(() => null);

  if (!pages) {
    return <main className="page-shell"><StatusPanel title="We couldn’t reach the movies" message="Check the TMDB key or your internet connection, then refresh this page." /></main>;
  }

  const [trending, popular, topRated, nowPlaying] = pages;
  const hero = trending.results.find((movie) => movie.backdrop_path) ?? trending.results[0];

  if (!hero) {
    return <main className="page-shell"><StatusPanel title="No films found" message="TMDB did not return any films. Please try again in a moment." /></main>;
  }

  const backdrop = imageUrl(hero.backdrop_path, "original");
  const genres = movieGenres(hero.genre_ids, 3);

  return (
    <main>
      <section className="hero" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}>
        <div className="hero-wash" />
        <div className="hero-grain" />
        <div className="hero-content">
          <p className="eyebrow light">Veloura premiere</p>
          <h1>{hero.title}</h1>
          <div className="hero-meta">
            <span className="hero-rating"><span aria-hidden="true">★</span> {rating(hero.vote_average)}</span>
            <span>{movieYear(hero.release_date)}</span>
            {genres.map((genre) => <span key={genre}>{genre}</span>)}
          </div>
          <p className="hero-overview">{hero.overview || "A story waiting to be discovered."}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/movie/${hero.id}`}><span className="play-mini" aria-hidden="true" /> Explore film</Link>
            <Link className="button button-ghost" href="/discover">Browse collection</Link>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true">
          <span>01</span><i /><span>{String(Math.min(trending.results.length, 20)).padStart(2, "0")}</span>
        </div>
        <p className="hero-caption">This week’s most watched story</p>
      </section>

      <div className="content-shell home-content">
        <section className="editorial-intro">
          <p className="eyebrow">Curated for tonight</p>
          <div>
            <h2>Great cinema leaves<br />a little light behind.</h2>
            <p>From quiet masterpieces to electric blockbusters, discover the films everyone will be talking about tomorrow.</p>
          </div>
        </section>

        <MovieRail eyebrow="Now in focus" title="Trending this week" movies={trending.results.slice(1)} href="/discover?sort=popularity.desc" />

        <section className="feature-strip">
          <div className="feature-number">24</div>
          <div>
            <p className="eyebrow light">A world of stories</p>
            <h2>One good film can change the shape of an evening.</h2>
          </div>
          <Link className="round-link" href="/discover" aria-label="Discover all movies">↗</Link>
        </section>

        <MovieRail eyebrow="Audience favorites" title="Popular right now" movies={popular.results} href="/discover?sort=popularity.desc" />
        <MovieRail eyebrow="The essential shelf" title="All-time acclaimed" movies={topRated.results} href="/discover?sort=vote_average.desc" />
        <MovieRail eyebrow="Fresh on the big screen" title="Now playing" movies={nowPlaying.results} href="/discover?sort=primary_release_date.desc" />
      </div>
    </main>
  );
}
