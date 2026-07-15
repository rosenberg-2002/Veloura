import Link from "next/link";
import { MovieRail } from "@/components/MovieRail";
import { StatusPanel } from "@/components/StatusPanel";
import { getGenres, getMoviePage } from "@/lib/tmdb";
import styles from "@/app/catalog.module.css";

export const dynamic = "force-dynamic";

const featuredGenres = [
  { id: 18, editorial: "Human stories, intimate performances, and unforgettable choices." },
  { id: 28, editorial: "Momentum, spectacle, and heroes pushed beyond their limits." },
  { id: 35, editorial: "Sharp wit, joyful chaos, and perfectly timed escapes." },
  { id: 878, editorial: "Bold futures, impossible worlds, and questions without easy answers." },
  { id: 27, editorial: "The dark, the uncanny, and stories that stay after the lights return." },
  { id: 16, editorial: "Hand-drawn dreams and digital worlds made for every generation." },
] as const;

export default async function GenresPage() {
  let genres: Awaited<ReturnType<typeof getGenres>>;
  let moviePages: Awaited<ReturnType<typeof getMoviePage>>[];

  try {
    [genres, moviePages] = await Promise.all([
      getGenres(),
      Promise.all(featuredGenres.map((genre) =>
        getMoviePage("/discover/movie", {
          with_genres: genre.id,
          sort_by: "popularity.desc",
          include_adult: false,
          "vote_count.gte": 100,
        }),
      )),
    ]);
  } catch {
    return <main className="page-shell"><StatusPanel title="Genres are between scenes" message="We couldn’t load the genre collection from TMDB. Please refresh and try again." /></main>;
  }

  const shelves = featuredGenres.map((featured, index) => ({
    ...featured,
    name: genres.find((genre) => genre.id === featured.id)?.name ?? "Cinema",
    movies: moviePages[index]?.results ?? [],
  }));

  return (
    <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Explore by feeling</p>
            <h1>Every kind of story.</h1>
            <p className={styles.heroDescription}>
              From pulse-quickening action to quiet human drama, find the cinematic language that fits your night.
            </p>
          </div>
        </section>

        <div className={styles.shell}>
          <section className={styles.directory} aria-labelledby="genre-directory-title">
            <div className={styles.directoryHeader}>
              <h2 id="genre-directory-title">Genre directory</h2>
              <p>Choose any genre to open its complete, popularity-ranked film collection.</p>
            </div>
            <nav className={styles.genreDirectory} aria-label="Movie genres">
              {genres.map((genre) => (
                <Link className={styles.genreLink} href={`/discover?genre=${genre.id}`} key={genre.id}>
                  <span>{genre.name}</span><span aria-hidden="true">↗</span>
                </Link>
              ))}
            </nav>
          </section>

          <div className={styles.featured}>
            {shelves.map((shelf) => (
              <MovieRail
                eyebrow={shelf.editorial}
                href={`/discover?genre=${shelf.id}`}
                key={shelf.id}
                movies={shelf.movies.slice(0, 8)}
                title={`${shelf.name}, in focus`}
              />
            ))}
          </div>
        </div>
    </main>
  );
}
