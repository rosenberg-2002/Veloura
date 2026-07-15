import { MovieRail } from "@/components/MovieRail";
import { StatusPanel } from "@/components/StatusPanel";
import { getMoviePage, imageUrl, tmdbFetch } from "@/lib/tmdb";
import styles from "@/app/catalog.module.css";

export const dynamic = "force-dynamic";

type CompanyDetails = {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
};

const majorStudios = [
  { id: 2, name: "Walt Disney Pictures", note: "Generations of spectacle, adventure, and family storytelling." },
  { id: 33, name: "Universal Pictures", note: "A century-spanning home for monsters, blockbusters, and modern classics." },
  { id: 174, name: "Warner Bros. Pictures", note: "Iconic characters and ambitious worlds from Hollywood’s golden age onward." },
  { id: 5, name: "Columbia Pictures", note: "The torch-bearing studio behind comedy, drama, and global franchises." },
  { id: 4, name: "Paramount Pictures", note: "Mountain-marked cinema, from enduring epics to crowd-pleasing franchises." },
  { id: 3, name: "Pixar", note: "Emotionally precise animation where imagination and technology meet." },
  { id: 420, name: "Marvel Studios", note: "A connected universe of heroes, legacies, and cinematic spectacle." },
  { id: 521, name: "DreamWorks Animation", note: "Bold animated comedy, heart, and unconventional heroes." },
  { id: 41077, name: "A24", note: "Singular filmmakers, daring perspectives, and contemporary cult favorites." },
  { id: 10342, name: "Studio Ghibli", note: "Hand-crafted wonder, ecological imagination, and deeply human journeys." },
] as const;

async function loadStudio(studio: (typeof majorStudios)[number]) {
  try {
    const [company, movies] = await Promise.all([
      tmdbFetch<CompanyDetails>(`/company/${studio.id}`),
      getMoviePage("/discover/movie", {
        with_companies: studio.id,
        sort_by: "popularity.desc",
        include_adult: false,
        "vote_count.gte": 100,
      }),
    ]);
    return { company, movies: movies.results, note: studio.note, available: true };
  } catch {
    return {
      company: {
        id: studio.id,
        name: studio.name,
        description: "",
        headquarters: "",
        homepage: "",
        logo_path: null,
        origin_country: "",
      },
      movies: [],
      note: studio.note,
      available: false,
    };
  }
}

export default async function ProductionsPage() {
  const studios = await Promise.all(majorStudios.map(loadStudio));

  if (studios.every((studio) => !studio.available)) {
    return <main className="page-shell"><StatusPanel title="The studio gates are closed" message="We couldn’t load production collections from TMDB. Please refresh and try again." /></main>;
  }

  return (
    <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Behind the pictures</p>
            <h1>The studios that shape cinema.</h1>
            <p className={styles.heroDescription}>
              Explore the production houses behind beloved characters, daring originals, and films that became part of culture.
            </p>
          </div>
        </section>

        <div className={`${styles.shell} ${styles.studioList}`}>
          {studios.map(({ company, movies, note }) => {
            const logo = imageUrl(company.logo_path, "w342");
            return (
              <section className={styles.studioSection} key={company.id}>
                <div className={styles.studioIdentity}>
                  <div className={styles.logoPanel}>
                    {logo ? <img alt={`${company.name} logo`} loading="lazy" src={logo} /> : <span className={styles.logoFallback}>{company.name}</span>}
                  </div>
                  <div className={styles.studioCopy}>
                    <p className={styles.kicker}>Studio collection</p>
                    <h2>{company.name}</h2>
                    <div className={styles.studioMeta}>
                      {company.origin_country && <span>{company.origin_country}</span>}
                      {company.headquarters && <span>{company.headquarters}</span>}
                      <span>{movies.length ? `${movies.length} highlights` : "Film archive"}</span>
                    </div>
                    <p className={styles.studioDescription}>{note}</p>
                  </div>
                </div>
                {movies.length ? (
                  <MovieRail
                    eyebrow="Most popular productions"
                    href={`/search?q=${encodeURIComponent(company.name)}&type=company`}
                    movies={movies.slice(0, 8)}
                    title={`Essential ${company.name}`}
                  />
                ) : <p className={styles.emptyRail}>This studio’s film shelf is temporarily unavailable.</p>}
              </section>
            );
          })}
        </div>
    </main>
  );
}
