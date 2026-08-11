import Link from "next/link";
import { StatusPanel } from "@/components/StatusPanel";
import { imageUrl, movieYear, rating, tmdbFetch } from "@/lib/tmdb";
import type { PersonDetails, PersonMovieCastCredit, PersonMovieCrewCredit } from "@/lib/types";
import styles from "./Person.module.css";

export const dynamic = "force-dynamic";
type PersonPageProps = { params: Promise<{ id: string }> };
const genderLabels: Record<number, string> = { 0: "Not specified", 1: "Female", 2: "Male", 3: "Non-binary" };

function formatDate(value: string | null): string {
  if (!value) return "Not listed";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function ageAt(birthday: string | null, deathday: string | null): number | null {
  if (!birthday) return null;
  const start = new Date(`${birthday}T00:00:00Z`);
  const end = deathday ? new Date(`${deathday}T00:00:00Z`) : new Date();
  let age = end.getUTCFullYear() - start.getUTCFullYear();
  if (end.getUTCMonth() < start.getUTCMonth() || (end.getUTCMonth() === start.getUTCMonth() && end.getUTCDate() < start.getUTCDate())) age -= 1;
  return age;
}

function creditTimestamp(credit: PersonMovieCastCredit | PersonMovieCrewCredit): number {
  return credit.release_date ? Date.parse(`${credit.release_date}T00:00:00Z`) : 0;
}

function sortCredits<T extends PersonMovieCastCredit | PersonMovieCrewCredit>(credits: T[]): T[] {
  return [...credits].sort((left, right) => creditTimestamp(right) - creditTimestamp(left) || (right.popularity ?? 0) - (left.popularity ?? 0));
}

function uniqueCast(credits: PersonMovieCastCredit[]): PersonMovieCastCredit[] {
  const movies = new Map<number, PersonMovieCastCredit>();
  for (const credit of sortCredits(credits)) {
    const current = movies.get(credit.id);
    if (!current) movies.set(credit.id, { ...credit });
    else if (credit.character && !current.character.includes(credit.character)) current.character = [current.character, credit.character].filter(Boolean).join(" / ");
  }
  return [...movies.values()];
}

function FilmCards({ credits, kind }: { credits: Array<PersonMovieCastCredit | PersonMovieCrewCredit>; kind: "cast" | "crew" }) {
  return <div className={styles.filmGrid}>{credits.map((credit) => {
    const poster = imageUrl(credit.poster_path, "w342");
    const role = kind === "cast" ? (credit as PersonMovieCastCredit).character : `${(credit as PersonMovieCrewCredit).job} · ${(credit as PersonMovieCrewCredit).department}`;
    return <article className={styles.filmCard} key={`${credit.credit_id}-${kind}`}><Link href={`/movie/${credit.id}`} aria-label={`View ${credit.title}`}>
      <div className={styles.filmPoster}>{poster ? <img alt={`${credit.title} poster`} loading="lazy" src={poster} /> : <span>{credit.title}</span>}<b><i aria-hidden="true">★</i> {rating(credit.vote_average)}</b></div>
      <h3>{credit.title}</h3><p>{movieYear(credit.release_date)}{role ? ` · ${role}` : ""}</p>
    </Link></article>;
  })}</div>;
}

function ExternalLinks({ person }: { person: PersonDetails }) {
  const ids = person.external_ids;
  const links = [
    person.homepage && { label: "Official website", href: person.homepage },
    (ids?.imdb_id || person.imdb_id) && { label: "IMDb", href: `https://www.imdb.com/name/${ids?.imdb_id || person.imdb_id}/` },
    ids?.instagram_id && { label: "Instagram", href: `https://www.instagram.com/${ids.instagram_id}/` },
    ids?.twitter_id && { label: "X / Twitter", href: `https://x.com/${ids.twitter_id}` },
    ids?.facebook_id && { label: "Facebook", href: `https://www.facebook.com/${ids.facebook_id}` },
    ids?.tiktok_id && { label: "TikTok", href: `https://www.tiktok.com/@${ids.tiktok_id}` },
    ids?.youtube_id && { label: "YouTube", href: `https://www.youtube.com/${ids.youtube_id}` },
    ids?.wikidata_id && { label: "Wikidata", href: `https://www.wikidata.org/wiki/${ids.wikidata_id}` },
  ].filter((link): link is { label: string; href: string } => Boolean(link));
  return links.length ? <div className={styles.externalLinks}>{links.map((link) => <a href={link.href} key={link.label} rel="noreferrer" target="_blank">{link.label} ↗</a>)}</div> : null;
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <main className="page-shell"><StatusPanel title="This person could not be found" message="The TMDB person ID is invalid." /></main>;
  let person: PersonDetails;
  try {
    person = await tmdbFetch<PersonDetails>(`/person/${id}`, { append_to_response: "movie_credits,external_ids,images" });
  } catch {
    return <main className="page-shell"><StatusPanel title="The spotlight is unavailable" message="We couldn’t load this person from TMDB. Please refresh and try again." /></main>;
  }

  const cast = uniqueCast(person.movie_credits?.cast ?? []);
  const crew = sortCredits(person.movie_credits?.crew ?? []);
  const uniqueMovieIds = new Set([...cast.map((credit) => credit.id), ...crew.map((credit) => credit.id)]);
  const age = ageAt(person.birthday, person.deathday);
  const portrait = imageUrl(person.profile_path, "h632");
  const backdropCredit = [...cast, ...crew].filter((credit) => credit.backdrop_path).sort((left, right) => (right.popularity ?? 0) - (left.popularity ?? 0))[0];
  const backdrop = imageUrl(backdropCredit?.backdrop_path, "original");
  const profiles = person.images?.profiles ?? [];

  return <main className={styles.page}>
    <section className={styles.hero} style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}><div className={styles.heroWash} /><div className={styles.heroInner}>
      <div className={styles.portrait}>{portrait ? <img alt={`${person.name} portrait`} src={portrait} /> : <span>{person.name.charAt(0)}</span>}</div>
      <div className={styles.heroCopy}><p className={styles.kicker}>{person.known_for_department || "Film professional"}</p><h1>{person.name}</h1><p className={styles.heroMeta}>{uniqueMovieIds.size} movie credits · TMDB popularity {Math.round(person.popularity)}</p><ExternalLinks person={person} /></div>
    </div></section>

    <div className={styles.shell}>
      <section className={styles.profileSection}><div><p className={styles.kicker}>Biography</p><h2>The person behind the work.</h2><p className={styles.biography}>{person.biography || "TMDB has not added a biography for this person yet."}</p></div>
        <aside className={styles.facts} aria-label={`${person.name} facts`}><dl><div><dt>Known for</dt><dd>{person.known_for_department || "Not listed"}</dd></div><div><dt>Born</dt><dd>{formatDate(person.birthday)}{age !== null ? ` · ${age}${person.deathday ? " at death" : " years old"}` : ""}</dd></div>{person.deathday && <div><dt>Died</dt><dd>{formatDate(person.deathday)}</dd></div>}<div><dt>Birthplace</dt><dd>{person.place_of_birth || "Not listed"}</dd></div><div><dt>Gender</dt><dd>{genderLabels[person.gender] || "Not specified"}</dd></div><div><dt>TMDB ID</dt><dd>{person.id}</dd></div></dl>
        {person.also_known_as.length > 0 && <div className={styles.aliases}><h3>Also known as</h3><p>{person.also_known_as.join(" · ")}</p></div>}</aside>
      </section>

      <section className={styles.creditSection}><div className={styles.sectionHeading}><div><p className={styles.kicker}>Complete filmography</p><h2>Movies as cast</h2></div><span>{cast.length} titles</span></div>{cast.length ? <><FilmCards credits={cast.slice(0, 12)} kind="cast" />{cast.length > 12 && <details className={styles.disclosure}><summary>Show all {cast.length} acting credits <span>↓</span></summary><FilmCards credits={cast.slice(12)} kind="cast" /></details>}</> : <p className={styles.empty}>No acting movie credits are listed on TMDB.</p>}</section>
      {crew.length > 0 && <section className={styles.creditSection}><div className={styles.sectionHeading}><div><p className={styles.kicker}>Behind the camera</p><h2>Movie crew credits</h2></div><span>{crew.length} credits</span></div><FilmCards credits={crew.slice(0, 12)} kind="crew" />{crew.length > 12 && <details className={styles.disclosure}><summary>Show all {crew.length} crew credits <span>↓</span></summary><FilmCards credits={crew.slice(12)} kind="crew" /></details>}</section>}
      {profiles.length > 0 && <section className={styles.creditSection}><div className={styles.sectionHeading}><div><p className={styles.kicker}>TMDB image archive</p><h2>Profile images</h2></div><span>{profiles.length} images</span></div><div className={styles.imageGrid}>{profiles.slice(0, 8).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} key={image.file_path} rel="noreferrer" target="_blank"><img alt={`${person.name} profile`} loading="lazy" src={imageUrl(image.file_path, "w342") ?? ""} /></a>)}</div>{profiles.length > 8 && <details className={styles.disclosure}><summary>Show all {profiles.length} profile images <span>↓</span></summary><div className={styles.imageGrid}>{profiles.slice(8).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} key={image.file_path} rel="noreferrer" target="_blank"><img alt={`${person.name} profile`} loading="lazy" src={imageUrl(image.file_path, "w342") ?? ""} /></a>)}</div></details>}</section>}
    </div>
  </main>;
}
