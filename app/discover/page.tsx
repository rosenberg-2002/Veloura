import { MovieCard } from "@/components/MovieCard";
import { StatusPanel } from "@/components/StatusPanel";
import { firstSearchParam, parsePageParam, type SearchParam } from "@/lib/search-params";
import { getGenres, getMoviePage } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type DiscoverProps = {
  searchParams: Promise<{ genre?: SearchParam; sort?: SearchParam; page?: SearchParam }>;
};

const sortOptions = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest releases" },
  { value: "revenue.desc", label: "Box office" },
];

export default async function DiscoverPage({ searchParams }: DiscoverProps) {
  const query = await searchParams;
  const genreValue = firstSearchParam(query.genre);
  const genre = /^\d+$/.test(genreValue) ? genreValue : "";
  const sortValue = firstSearchParam(query.sort);
  const sort = sortOptions.some((option) => option.value === sortValue) ? sortValue : "popularity.desc";
  const page = parsePageParam(query.page);

  const data = await Promise.all([
    getGenres(),
    getMoviePage("/discover/movie", {
      sort_by: sort,
      with_genres: genre,
      page,
      include_adult: false,
      "vote_count.gte": sort === "vote_average.desc" ? 300 : undefined,
    }),
  ]).catch(() => null);

  if (!data) {
    return <main className="page-shell"><StatusPanel title="Discovery is taking a moment" message="We couldn’t load TMDB right now. Please refresh and try again." /></main>;
  }

  const [genres, movies] = data;
  const selectedGenre = genres.find((item) => String(item.id) === genre);

  return (
      <main className="inner-page">
        <section className="page-heading content-shell">
          <p className="eyebrow">Find your next favorite</p>
          <h1>{selectedGenre ? selectedGenre.name : "Discover movies"}</h1>
          <p>Explore cinema by mood, genre, and the stories audiences cannot stop watching.</p>
        </section>

        <div className="content-shell">
          <form className="filter-bar" action="/discover">
            <label>
              <span>Genre</span>
              <select name="genre" defaultValue={genre}>
                <option value="">All genres</option>
                {genres.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select name="sort" defaultValue={sort}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button className="button button-primary" type="submit">Refine selection</button>
          </form>

          {movies.results.length ? (
            <>
              <div className="results-note"><span>{movies.total_results.toLocaleString()} films</span><i /></div>
              <section className="movie-grid" aria-label="Movie results">
                {movies.results.map((movie, index) => <MovieCard key={movie.id} movie={movie} priority={index < 5} />)}
              </section>
              <nav className="pagination" aria-label="Results pages">
                {page > 1 ? <a className="button button-outline" href={`/discover?genre=${genre}&sort=${sort}&page=${page - 1}`}>← Previous</a> : <span className="pagination-spacer" aria-hidden="true" />}
                <span className="pagination-status">Page {page} of {Math.min(movies.total_pages, 500)}</span>
                {page < Math.min(movies.total_pages, 500) ? <a className="button button-outline" href={`/discover?genre=${genre}&sort=${sort}&page=${page + 1}`}>Next →</a> : <span className="pagination-spacer" aria-hidden="true" />}
              </nav>
            </>
          ) : <StatusPanel title="No films in this frame" message="Try another genre or a broader selection." />}
        </div>
      </main>
  );
}
