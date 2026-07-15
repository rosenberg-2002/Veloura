import Link from "next/link";
import { StatusPanel } from "@/components/StatusPanel";
import { firstSearchParam, type SearchParam } from "@/lib/search-params";
import { imageUrl, movieYear, tmdbFetch } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/types";
import styles from "@/app/catalog.module.css";

export const dynamic = "force-dynamic";

type KnownForMovie = MovieSummary & { media_type: "movie" };

type PopularPerson = {
  id: number;
  name: string;
  gender: number;
  known_for_department: string;
  popularity: number;
  profile_path: string | null;
  known_for: Array<KnownForMovie | { media_type: string }>;
};

type PopularPeopleResponse = {
  page: number;
  results: PopularPerson[];
  total_pages: number;
  total_results: number;
};

type PeoplePageProps = {
  searchParams: Promise<{ role?: SearchParam; sort?: SearchParam }>;
};

const roles = [
  { value: "all", label: "Actors & actresses" },
  { value: "actresses", label: "Actresses" },
  { value: "actors", label: "Actors" },
] as const;

const sorts = [
  { value: "popularity", label: "Most famous" },
  { value: "name", label: "Name A–Z" },
  { value: "movies", label: "Most known-for movies" },
] as const;

function isKnownMovie(item: KnownForMovie | { media_type: string }): item is KnownForMovie {
  return item.media_type === "movie" && "title" in item;
}

function personMovies(person: PopularPerson) {
  return person.known_for.filter(isKnownMovie);
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const query = await searchParams;
  const roleValue = firstSearchParam(query.role);
  const sortValue = firstSearchParam(query.sort);
  const role = roles.some((item) => item.value === roleValue) ? roleValue : "all";
  const sort = sorts.some((item) => item.value === sortValue) ? sortValue : "popularity";

  let responses: PopularPeopleResponse[];

  try {
    responses = await Promise.all(
      [1, 2, 3].map((page) => tmdbFetch<PopularPeopleResponse>("/person/popular", { page })),
    );
  } catch {
    return <main className="page-shell"><StatusPanel title="The spotlight is resetting" message="We couldn’t load performers from TMDB. Please refresh and try again." /></main>;
  }

  let people = responses
    .flatMap((response) => response.results)
    .filter((person) => person.known_for_department === "Acting" && personMovies(person).length > 0);

  if (role === "actresses") people = people.filter((person) => person.gender === 1);
  if (role === "actors") people = people.filter((person) => person.gender === 2);

  people.sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name);
    if (sort === "movies") return personMovies(right).length - personMovies(left).length || right.popularity - left.popularity;
    return right.popularity - left.popularity;
  });

  people = people.slice(0, 30);
  const roleLabel = roles.find((item) => item.value === role)?.label ?? roles[0].label;
  const sortLabel = sorts.find((item) => item.value === sort)?.label ?? sorts[0].label;

  return (
    <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Faces of cinema</p>
            <h1>Artists we follow anywhere.</h1>
            <p className={styles.heroDescription}>
              Meet today’s most-watched performers and move directly into the films that made their work essential.
            </p>
          </div>
        </section>

        <div className={styles.shell}>
          <form action="/people" className={styles.filters}>
            <label>
              <span>Show</span>
              <select defaultValue={role} name="role">
                {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select defaultValue={sort} name="sort">
                {sorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button className={styles.filterButton} type="submit">Apply filters</button>
          </form>

          <div className={styles.peopleSummary}>
            <span>{roleLabel}</span>
            <span>{sortLabel} · {people.length} people</span>
          </div>

          {people.length ? (
            <section className={styles.peopleGrid} aria-label="Popular actors and actresses">
              {people.map((person) => {
                const portrait = imageUrl(person.profile_path, "w342");
                const movies = personMovies(person).slice(0, 3);
                return (
                  <article className={styles.personCard} key={person.id}>
                    <div className={styles.personHeading}>
                      <div className={styles.portrait}>
                        {portrait ? <img alt={`${person.name} portrait`} loading="lazy" src={portrait} /> : <span>{person.name.charAt(0)}</span>}
                      </div>
                      <div>
                        <h2>{person.name}</h2>
                        <p>{person.known_for_department} · Popularity {Math.round(person.popularity)}</p>
                      </div>
                    </div>
                    <div className={styles.knownFor} aria-label={`${person.name} known for`}>
                      {movies.map((movie) => {
                        const poster = imageUrl(movie.poster_path, "w342");
                        return (
                          <Link href={`/movie/${movie.id}`} key={movie.id}>
                            <div className={styles.knownPoster}>
                              {poster ? <img alt={`${movie.title} poster`} loading="lazy" src={poster} /> : <span>{movie.title}</span>}
                            </div>
                            <h3>{movie.title}</h3>
                            <p>{movieYear(movie.release_date)}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </section>
          ) : <p className={styles.noPeople}>No performers match this selection yet.</p>}
        </div>
    </main>
  );
}
