import { MovieRail } from "@/components/MovieRail";
import { StatusPanel } from "@/components/StatusPanel";
import { PRODUCTION_CATALOG } from "@/lib/production-catalog";
import { firstSearchParam, type SearchParam } from "@/lib/search-params";
import { getMoviePage, imageUrl, tmdbFetch } from "@/lib/tmdb";
import styles from "@/app/catalog.module.css";

export const dynamic = "force-dynamic";
const COMPANIES_PER_PAGE = 10;

type CompanyDetails = {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
};

type CompanySeed = Pick<CompanyDetails, "id" | "name" | "logo_path" | "origin_country"> & { note?: string };
type CompanySearchResponse = { page: number; results: CompanySeed[]; total_pages: number; total_results: number };
type ProductionsPageProps = { searchParams: Promise<{ q?: SearchParam; page?: SearchParam }> };

async function loadStudio(seed: CompanySeed) {
  const [companyResult, moviesResult] = await Promise.allSettled([
    tmdbFetch<CompanyDetails>(`/company/${seed.id}`),
    getMoviePage("/discover/movie", { with_companies: seed.id, sort_by: "popularity.desc", include_adult: false, "vote_count.gte": 50 }),
  ]);
  const company = companyResult.status === "fulfilled" ? companyResult.value : { ...seed, description: "", headquarters: "", homepage: "" };
  const movies = moviesResult.status === "fulfilled" ? moviesResult.value.results : [];
  return { company, movies, note: seed.note || company.description || "Explore this company’s most popular productions on TMDB." };
}

function pageHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/productions?${suffix}` : "/productions";
}

function paginationPages(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const visible = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right);
  const items: Array<number | string> = [];

  visible.forEach((page, index) => {
    const previous = visible[index - 1];
    if (previous && page - previous > 1) items.push(`ellipsis-${previous}`);
    items.push(page);
  });

  return items;
}

export default async function ProductionsPage({ searchParams }: ProductionsPageProps) {
  const params = await searchParams;
  const query = firstSearchParam(params.q).trim().slice(0, 80);
  const requestedPage = Number.parseInt(firstSearchParam(params.page), 10);
  let page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let totalResults = PRODUCTION_CATALOG.length;
  let totalPages = Math.ceil(PRODUCTION_CATALOG.length / COMPANIES_PER_PAGE);
  let seeds: CompanySeed[] = [];

  if (query) {
    try {
      const tmdbPage = Math.ceil(page / 2);
      const response = await tmdbFetch<CompanySearchResponse>("/search/company", { query, page: tmdbPage });
      const offset = (page - 1) % 2 === 0 ? 0 : COMPANIES_PER_PAGE;
      seeds = response.results.slice(offset, offset + COMPANIES_PER_PAGE);
      totalResults = response.total_results;
      totalPages = Math.min(Math.ceil(response.total_results / COMPANIES_PER_PAGE), response.total_pages * 2, 1000);
    } catch {
      return <main className="page-shell"><StatusPanel title="The studio directory is unavailable" message="We couldn’t search TMDB right now. Please refresh and try again." /></main>;
    }
  } else {
    page = Math.min(page, totalPages);
    const start = (page - 1) * COMPANIES_PER_PAGE;
    seeds = PRODUCTION_CATALOG.slice(start, start + COMPANIES_PER_PAGE);
  }

  const studios = await Promise.all(seeds.map(loadStudio));
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.kicker}>Behind the pictures</p><h1>The studios that shape cinema.</h1><p className={styles.heroDescription}>Search the TMDB production-company database, then explore each company through the films audiences know best.</p></div></section>

    <div className={`${styles.shell} ${styles.companyDirectory}`}>
      <form action="/productions" className={styles.companySearch}>
        <label htmlFor="company-query"><span>Production company</span><input defaultValue={query} id="company-query" name="q" placeholder="Disney, Universal, Pixar…" /></label>
        <button className={styles.filterButton} type="submit">Search companies</button>
      </form>
      <nav className={styles.companyAlphabet} aria-label="Search production companies by letter">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => <a href={pageHref(letter, 1)} key={letter}>{letter}</a>)}</nav>
      <div className={styles.peopleSummary}><span>{query ? `Companies matching “${query}”` : "Featured production companies"}</span><span>{totalResults.toLocaleString()} results · 10 per page</span></div>

      {studios.length ? <div className={styles.studioList}>{studios.map(({ company, movies, note }) => {
        const logo = imageUrl(company.logo_path, "w342");
        return <section className={styles.studioSection} key={company.id}>
          <div className={styles.studioIdentity}><div className={styles.logoPanel}>{logo ? <img alt={`${company.name} logo`} loading="lazy" src={logo} /> : <span className={styles.logoFallback}>{company.name}</span>}</div>
            <div className={styles.studioCopy}><p className={styles.kicker}>TMDB company #{company.id}</p><h2>{company.name}</h2><div className={styles.studioMeta}>{company.origin_country && <span>{company.origin_country}</span>}{company.headquarters && <span>{company.headquarters}</span>}<span>{movies.length ? `${movies.length} highlights` : "Film archive"}</span></div><p className={styles.studioDescription}>{company.description || note}</p>{company.homepage && <a className={styles.companyHomepage} href={company.homepage} rel="noreferrer" target="_blank">Official website ↗</a>}</div>
          </div>
          {movies.length ? <MovieRail eyebrow="Most popular productions" href={`/search?q=${encodeURIComponent(company.name)}&type=productions`} movies={movies.slice(0, 8)} title={`Essential ${company.name}`} /> : <p className={styles.emptyRail}>TMDB does not currently list popular movie highlights for this company.</p>}
        </section>;
      })}</div> : <p className={styles.noPeople}>No production companies match this search.</p>}

      {totalPages > 1 && <nav className={styles.catalogPagination} aria-label="Production company pages">
        {page > 1 ? <a className="button button-outline" href={pageHref(query, page - 1)}>← Previous</a> : <span />}
        <div className={styles.pageNumbers}>
          {paginationPages(page, totalPages).map((item) => typeof item === "number" ? (
            <a
              aria-current={item === page ? "page" : undefined}
              className={`${styles.pageNumber} ${item === page ? styles.pageNumberActive : ""}`}
              href={pageHref(query, item)}
              key={item}
            >
              {item}
            </a>
          ) : <span className={styles.paginationEllipsis} key={item}>…</span>)}
        </div>
        {page < totalPages ? <a className="button button-outline" href={pageHref(query, page + 1)}>Next →</a> : <span />}
      </nav>}
    </div>
  </main>;
}
