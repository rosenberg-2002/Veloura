import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { StatusPanel } from "@/components/StatusPanel";
import { firstSearchParam, parsePageParam, type SearchParam } from "@/lib/search-params";
import { imageUrl, tmdbFetch } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/types";
import styles from "./Search.module.css";

export const dynamic = "force-dynamic";

type SearchCategory = "all" | "movies" | "people" | "productions";

type SearchProps = {
  searchParams: Promise<{ q?: SearchParam; type?: SearchParam; page?: SearchParam }>;
};

type SearchPageResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

type KnownForWork = {
  id: number;
  media_type?: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

type PersonResult = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  known_for?: KnownForWork[];
  media_type?: "person";
};

type CompanyResult = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
};



const categories: { value: SearchCategory; label: string; hint: string }[] = [
  { value: "all", label: "Everything", hint: "Films, people, and studios" },
  { value: "movies", label: "Movies", hint: "Titles and original titles" },
  { value: "people", label: "People", hint: "Actors, actresses, and directors" },
  { value: "productions", label: "Productions", hint: "Studios and production brands" },
];

function normalizeCategory(value: SearchParam): SearchCategory {
  const categoryValue = firstSearchParam(value);
  if (categoryValue === "company") return "productions";
  return categories.some((category) => category.value === categoryValue) ? categoryValue as SearchCategory : "all";
}

function SearchForm({ query = "", category = "all", autoFocus = false }: { query?: string; category?: SearchCategory; autoFocus?: boolean }) {
  return (
    <form className={styles.searchForm} action="/search" role="search">
      <label className={styles.queryField}>
        <span>Search term</span>
        <input autoFocus={autoFocus} name="q" defaultValue={query} aria-label="Search Veloura" placeholder="A film, person, director, or studio…" />
      </label>
      <label className={styles.typeField}>
        <span>Look in</span>
        <select name="type" defaultValue={category} aria-label="Search category">
          <option value="all">Everything</option>
          <option value="movies">Movies</option>
          <option value="people">People</option>
          <option value="productions">Productions</option>
        </select>
      </label>
      <button className="button button-primary" type="submit">Search</button>
    </form>
  );
}

function CategoryMenu({ query, active }: { query: string; active: SearchCategory }) {
  return (
    <nav className={styles.categoryMenu} aria-label="Search result categories">
      {categories.map((category) => (
        <Link
          aria-current={active === category.value ? "page" : undefined}
          className={active === category.value ? styles.activeCategory : undefined}
          key={category.value}
          href={`/search?q=${encodeURIComponent(query)}&type=${category.value}`}
        >
          <strong>{category.label}</strong>
          <span>{category.hint}</span>
        </Link>
      ))}
    </nav>
  );
}

function PersonCard({ person }: { person: PersonResult }) {
  const profile = imageUrl(person.profile_path, "w342");
  const knownFor = (person.known_for || []).filter((work) => work.media_type === "movie").slice(0, 4);

  return (
    <article className={styles.personCard}>
      <a className={styles.personIdentity} href={`/person/${person.id}`}>
        <div className={styles.personPhoto}>
          {profile ? <img src={profile} alt={`${person.name} portrait`} loading="lazy" /> : <span>{person.name.charAt(0)}</span>}
        </div>
        <div>
          <p>{person.known_for_department || "Film professional"}</p>
          <h3>{person.name}</h3>
          <span>View filmography →</span>
        </div>
      </a>
      {knownFor.length > 0 && (
        <div className={styles.knownFor}>
          <p>Known for</p>
          <div>
            {knownFor.map((work) => {
              const title = work.title || work.name || "Untitled";
              const year = (work.release_date || work.first_air_date || "").slice(0, 4);
              return (
                <Link key={`${work.media_type}-${work.id}`} href={`/movie/${work.id}`}>
                  <strong>{title}</strong>
                  {year && <span>{year}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

function CompanyCard({ company }: { company: CompanyResult }) {
  const logo = imageUrl(company.logo_path, "w342");
  return (
    <a className={styles.companyCard} href={`https://www.themoviedb.org/company/${company.id}`} target="_blank" rel="noreferrer">
      <div className={styles.companyLogo}>
        {logo ? <img src={logo} alt={`${company.name} logo`} loading="lazy" /> : <span>{company.name.charAt(0)}</span>}
      </div>
      <div>
        <p>Production company</p>
        <h3>{company.name}</h3>
        <span>{company.origin_country ? `Based in ${company.origin_country}` : "Country not listed"}</span>
      </div>
      <i aria-hidden="true">↗</i>
    </a>
  );
}

function SectionHeading({ kicker, title, count }: { kicker: string; title: string; count: number }) {
  return (
    <div className={styles.sectionHeading}>
      <div><p>{kicker}</p><h2>{title}</h2></div>
      <span>{count.toLocaleString()} {count === 1 ? "match" : "matches"}</span>
    </div>
  );
}

function Pagination({ query, category, page, totalPages }: { query: string; category: SearchCategory; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (target: number) => `/search?q=${encodeURIComponent(query)}&type=${category}&page=${target}`;
  return (
    <nav className="pagination" aria-label="Search result pages">
      {page > 1 ? <Link className="button button-outline" href={href(page - 1)}>← Previous</Link> : <span className="pagination-spacer" aria-hidden="true" />}
      <span className="pagination-status">Page {page} of {Math.min(totalPages, 500)}</span>
      {page < totalPages && page < 500 ? <Link className="button button-outline" href={href(page + 1)}>Next →</Link> : <span className="pagination-spacer" aria-hidden="true" />}
    </nav>
  );
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const query = firstSearchParam(params.q).trim();
  const category = normalizeCategory(params.type);
  const page = parsePageParam(params.page);

  if (!query) {
    return (
      <main className={`inner-page search-empty ${styles.emptyPage}`}>
        <div className="content-shell narrow-shell">
          <p className="eyebrow">Search the whole film world</p>
          <h1>Who—or what—are you looking for?</h1>
          <p className={styles.intro}>Find a movie by title, explore an actor or director, or open the catalogue of a production studio.</p>
          <SearchForm category={category} autoFocus />
          <CategoryMenu query="" active={category} />
        </div>
      </main>
    );
  }

  let movies: SearchPageResponse<MovieSummary> | null = null;
  let people: SearchPageResponse<PersonResult> | null = null;
  let companies: SearchPageResponse<CompanyResult> | null = null;
  let resultPages = 1;

  try {
    if (category === "all") {
      [movies, people, companies] = await Promise.all([
        tmdbFetch<SearchPageResponse<MovieSummary>>("/search/movie", { query, page: 1, include_adult: false }),
        tmdbFetch<SearchPageResponse<PersonResult>>("/search/person", { query, page: 1, include_adult: false }),
        tmdbFetch<SearchPageResponse<CompanyResult>>("/search/company", { query, page: 1 }),
      ]);
    } else if (category === "movies") {
      movies = await tmdbFetch<SearchPageResponse<MovieSummary>>("/search/movie", { query, page, include_adult: false });
      resultPages = movies.total_pages;
    } else if (category === "people") {
      people = await tmdbFetch<SearchPageResponse<PersonResult>>("/search/person", { query, page, include_adult: false });
      resultPages = people.total_pages;
    } else {
      companies = await tmdbFetch<SearchPageResponse<CompanyResult>>("/search/company", { query, page });
      resultPages = companies.total_pages;
    }

  } catch {
    return <main className="page-shell"><StatusPanel title="Search is unavailable" message="We couldn’t reach TMDB. Please try again shortly." /></main>;
  }

  const hasResults = Boolean(movies?.results.length || people?.results.length || companies?.results.length);

  return (
    <main className={`inner-page ${styles.searchPage}`}>
      <section className={`page-heading content-shell ${styles.hero}`}>
        <p className="eyebrow">Universal search</p>
        <h1>“{query}”</h1>
        <SearchForm query={query} category={category} />
        <CategoryMenu query={query} active={category} />
      </section>

      <div className={`content-shell ${styles.results}`}>
        {!hasResults && <StatusPanel title="No match yet" message="Try another spelling, a full name, or switch to Everything to search every category." />}

        {movies && movies.results.length > 0 && (
          <section className={styles.resultSection} aria-label="Movie results">
            <SectionHeading kicker="Titles" title="Movies" count={movies.total_results} />
            <div className="movie-grid">
              {movies.results.map((movie, index) => <MovieCard key={movie.id} movie={movie} priority={index < 5} />)}
            </div>
          </section>
        )}

        {people && people.results.length > 0 && (
          <section className={styles.resultSection} aria-label="People results">
            <SectionHeading kicker="Cast & crew" title="People" count={people.total_results} />
            <div className={styles.peopleGrid}>
              {people.results.map((person) => <PersonCard key={person.id} person={person} />)}
            </div>
          </section>
        )}

        {companies && companies.results.length > 0 && (
          <section className={styles.resultSection} aria-label="Production company results">
            <SectionHeading kicker="Studios & labels" title="Productions" count={companies.total_results} />
            <div className={styles.companyGrid}>
              {companies.results.map((company) => <CompanyCard key={company.id} company={company} />)}
            </div>
          </section>
        )}

        {hasResults && <Pagination query={query} category={category} page={page} totalPages={resultPages} />}
      </div>
    </main>
  );
}
