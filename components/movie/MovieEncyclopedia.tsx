import Link from "next/link";
import { MovieRail } from "@/components/MovieRail";
import { imageUrl, movieYear, rating } from "@/lib/tmdb";
import type {
  CollectionDetails,
  CrewMember,
  MovieDetails,
  ProductionCompany,
  ReleaseDateGroup,
  WatchProvider,
  WatchRegion,
} from "@/lib/types";

type MovieEncyclopediaProps = {
  movie: MovieDetails;
  collection: CollectionDetails | null;
};

const releaseTypes: Record<number, string> = {
  1: "Premiere",
  2: "Limited theatrical",
  3: "Theatrical",
  4: "Digital",
  5: "Physical",
  6: "TV",
};

const departmentOrder = [
  "Directing",
  "Writing",
  "Production",
  "Camera",
  "Editing",
  "Sound",
  "Art",
  "Costume & Make-Up",
  "Visual Effects",
  "Lighting",
  "Crew",
];

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function regionName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function uniqueCrew(crew: CrewMember[], jobs: string[]) {
  const matches = crew.filter((person) => jobs.includes(person.job));
  return Array.from(new Map(matches.map((person) => [`${person.id}-${person.job}`, person])).values());
}

function PeopleLine({ label, people }: { label: string; people: CrewMember[] }) {
  if (!people.length) return null;
  return (
    <div className="creative-row">
      <span>{label}</span>
      <p>{people.map((person, index) => (
        <span key={`${person.id}-${person.job}`}>
          <a href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noreferrer">{person.name}</a>
          {index < people.length - 1 ? ", " : ""}
        </span>
      ))}</p>
    </div>
  );
}

function CompanyCard({ company }: { company: ProductionCompany }) {
  const logo = imageUrl(company.logo_path, "w342");
  return (
    <a className="company-card" href={`https://www.themoviedb.org/company/${company.id}`} target="_blank" rel="noreferrer">
      <div>{logo ? <img src={logo} alt="" loading="lazy" /> : <span aria-hidden="true">{company.name.slice(0, 1)}</span>}</div>
      <strong>{company.name}</strong>
      {company.origin_country && <small>{regionName(company.origin_country)}</small>}
    </a>
  );
}

function ProviderGroup({ label, providers }: { label: string; providers?: WatchProvider[] }) {
  if (!providers?.length) return null;
  return (
    <div className="provider-group">
      <span>{label}</span>
      <div>
        {providers.map((provider) => {
          const logo = imageUrl(provider.logo_path, "w342");
          return (
            <div className="provider" key={`${label}-${provider.provider_id}`} title={provider.provider_name}>
              {logo && <img src={logo} alt="" loading="lazy" />}
              <small>{provider.provider_name}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProviderRegion({ code, region }: { code: string; region: WatchRegion }) {
  return (
    <article className="provider-region">
      <div className="provider-region-heading">
        <h3>{regionName(code)}</h3>
        <a href={region.link} target="_blank" rel="noreferrer">See options ↗</a>
      </div>
      <ProviderGroup label="Stream" providers={region.flatrate} />
      <ProviderGroup label="Free" providers={region.free} />
      <ProviderGroup label="With ads" providers={region.ads} />
      <ProviderGroup label="Rent" providers={region.rent} />
      <ProviderGroup label="Buy" providers={region.buy} />
    </article>
  );
}

function ReleaseRegion({ group }: { group: ReleaseDateGroup }) {
  return (
    <article className="release-region">
      <h3>{regionName(group.iso_3166_1)} <small>{group.iso_3166_1}</small></h3>
      <div>
        {group.release_dates.map((release, index) => (
          <div className="release-entry" key={`${release.release_date}-${release.type}-${index}`}>
            <time dateTime={release.release_date}>{formatDate(release.release_date)}</time>
            <span>{releaseTypes[release.type] ?? "Release"}</span>
            {release.certification && <strong>{release.certification}</strong>}
            {release.note && <p>{release.note}</p>}
            {!!release.descriptors?.length && <p>{release.descriptors.join(", ")}</p>}
          </div>
        ))}
      </div>
    </article>
  );
}

export function MovieEncyclopedia({ movie, collection }: MovieEncyclopediaProps) {
  const cast = movie.credits?.cast ?? [];
  const crew = movie.credits?.crew ?? [];
  const directors = uniqueCrew(crew, ["Director"]);
  const writers = uniqueCrew(crew, ["Writer", "Screenplay", "Story", "Novel"]);
  const producers = uniqueCrew(crew, ["Producer", "Executive Producer"]);
  const composers = uniqueCrew(crew, ["Original Music Composer", "Music"]);
  const cinematographers = uniqueCrew(crew, ["Director of Photography"]);
  const editors = uniqueCrew(crew, ["Editor"]);
  const groupedCrew = Array.from(
    crew.reduce((groups, person) => {
      const group = groups.get(person.department) ?? [];
      group.push(person);
      groups.set(person.department, group);
      return groups;
    }, new Map<string, CrewMember[]>()),
  ).sort(([a], [b]) => {
    const ai = departmentOrder.indexOf(a);
    const bi = departmentOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b);
  });
  const releases = [...(movie.release_dates?.results ?? [])].sort((a, b) => {
    const priority = ["US", "VN", "GB", "CA", "AU"];
    const ai = priority.indexOf(a.iso_3166_1);
    const bi = priority.indexOf(b.iso_3166_1);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.iso_3166_1.localeCompare(b.iso_3166_1);
  });
  const watchRegions = Object.entries(movie["watch/providers"]?.results ?? {}).sort(([a], [b]) => {
    const priority = ["VN", "US", "GB", "CA", "AU"];
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b);
  });
  const videos = (movie.videos?.results ?? []).filter((video) => video.site === "YouTube");
  const backdrops = movie.images?.backdrops ?? [];
  const posters = movie.images?.posters ?? [];
  const logos = movie.images?.logos ?? [];
  const reviews = movie.reviews?.results ?? [];
  const alternativeTitles = movie.alternative_titles?.titles ?? [];
  const translations = movie.translations?.translations ?? [];
  const externalIds = movie.external_ids;
  const certification = releases
    .find((group) => group.iso_3166_1 === "US")
    ?.release_dates.find((release) => release.certification)?.certification;

  return (
    <div className="content-shell encyclopedia">
      <nav className="reference-nav" aria-label="Movie information sections">
        <a href="#story">Story</a>
        {cast.length > 0 && <a href="#cast">Cast</a>}
        {crew.length > 0 && <a href="#crew">Crew</a>}
        <a href="#details">Details</a>
        {releases.length > 0 && <a href="#releases">Releases</a>}
        {videos.length > 0 && <a href="#media">Media</a>}
        {(backdrops.length > 0 || posters.length > 0 || logos.length > 0) && <a href="#artwork">Artwork</a>}
        {reviews.length > 0 && <a href="#reviews">Reviews</a>}
      </nav>

      <div className="reference-layout" id="story">
        <article className="reference-main">
          <section className="reference-section story-section">
            <p className="eyebrow">The complete story</p>
            <h2>Storyline</h2>
            <p className="story-copy">{movie.overview || "No overview has been added to TMDB for this movie."}</p>
            {(directors.length > 0 || writers.length > 0 || producers.length > 0 || composers.length > 0 || cinematographers.length > 0 || editors.length > 0) && (
              <div className="creative-table">
                <PeopleLine label="Directed by" people={directors} />
                <PeopleLine label="Writing" people={writers} />
                <PeopleLine label="Produced by" people={producers} />
                <PeopleLine label="Music" people={composers} />
                <PeopleLine label="Cinematography" people={cinematographers} />
                <PeopleLine label="Editing" people={editors} />
              </div>
            )}
          </section>
        </article>

        <aside className="reference-sidebar" aria-label="At a glance">
          <p className="eyebrow">At a glance</p>
          <dl>
            {movie.original_title && movie.original_title !== movie.title && <><dt>Original title</dt><dd>{movie.original_title}</dd></>}
            <dt>Status</dt><dd>{movie.status}</dd>
            {certification && <><dt>Certification</dt><dd>{certification}</dd></>}
            {movie.release_date && <><dt>Primary release</dt><dd>{formatDate(movie.release_date)}</dd></>}
            <dt>Original language</dt><dd>{movie.spoken_languages.find((language) => language.iso_639_1 === movie.original_language)?.english_name ?? movie.original_language.toUpperCase()}</dd>
            {movie.origin_country?.length > 0 && <><dt>Country of origin</dt><dd>{movie.origin_country.map(regionName).join(", ")}</dd></>}
            {movie.production_countries.length > 0 && <><dt>Production countries</dt><dd>{movie.production_countries.map((country) => country.name).join(", ")}</dd></>}
            <dt>TMDB ID</dt><dd>{movie.id}</dd>
            {(externalIds?.imdb_id || movie.imdb_id) && <><dt>IMDb ID</dt><dd>{externalIds?.imdb_id || movie.imdb_id}</dd></>}
            {externalIds?.wikidata_id && <><dt>Wikidata ID</dt><dd>{externalIds.wikidata_id}</dd></>}
          </dl>
          <div className="external-links">
            {movie.homepage && <a href={movie.homepage} target="_blank" rel="noreferrer">Official website ↗</a>}
            {(externalIds?.imdb_id || movie.imdb_id) && <a href={`https://www.imdb.com/title/${externalIds?.imdb_id || movie.imdb_id}/`} target="_blank" rel="noreferrer">IMDb ↗</a>}
            {externalIds?.wikidata_id && <a href={`https://www.wikidata.org/wiki/${externalIds.wikidata_id}`} target="_blank" rel="noreferrer">Wikidata ↗</a>}
            {externalIds?.facebook_id && <a href={`https://www.facebook.com/${externalIds.facebook_id}`} target="_blank" rel="noreferrer">Facebook ↗</a>}
            {externalIds?.instagram_id && <a href={`https://www.instagram.com/${externalIds.instagram_id}`} target="_blank" rel="noreferrer">Instagram ↗</a>}
            {externalIds?.twitter_id && <a href={`https://x.com/${externalIds.twitter_id}`} target="_blank" rel="noreferrer">X ↗</a>}
          </div>
        </aside>
      </div>

      {cast.length > 0 && (
        <section className="reference-section" id="cast">
          <div className="reference-heading">
            <div><p className="eyebrow">Every credited performance</p><h2>Cast</h2></div>
            <span>{cast.length} credits</span>
          </div>
          <div className="full-cast-grid">
            {cast.slice(0, 12).map((person, index) => {
              const portrait = imageUrl(person.profile_path, "w342");
              return (
                <a className="full-cast-card" href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noreferrer" key={`${person.credit_id ?? person.id}-${index}`}>
                  <div>{portrait ? <img src={portrait} alt="" loading="lazy" /> : <span aria-hidden="true">{person.name.slice(0, 1)}</span>}</div>
                  <h3>{person.name}</h3>
                  <p>{person.character || "Unspecified role"}</p>
                </a>
              );
            })}
          </div>
          {cast.length > 12 && (
            <details className="data-disclosure">
              <summary>View all {cast.length} cast credits <span>+</span></summary>
              <div className="credit-list">
                {cast.slice(12).map((person, index) => (
                  <a href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noreferrer" key={`${person.credit_id ?? person.id}-all-${index}`}>
                    <strong>{person.name}</strong><span>{person.character || "Unspecified role"}</span>
                  </a>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {groupedCrew.length > 0 && (
        <section className="reference-section" id="crew">
          <div className="reference-heading">
            <div><p className="eyebrow">Behind the camera</p><h2>Full crew</h2></div>
            <span>{crew.length} credits</span>
          </div>
          <div className="crew-departments">
            {groupedCrew.map(([department, people], index) => (
              <details className="crew-department" key={department} open={index < 2}>
                <summary><span>{department}</span><small>{people.length} credits</small><i>+</i></summary>
                <div>
                  {people.map((person, personIndex) => (
                    <a href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noreferrer" key={`${person.credit_id ?? person.id}-${person.job}-${personIndex}`}>
                      <strong>{person.name}</strong><span>{person.job}</span>
                    </a>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="reference-section" id="details">
        <div className="reference-heading">
          <div><p className="eyebrow">The record</p><h2>Production & details</h2></div>
        </div>
        {(movie.budget > 0 || movie.revenue > 0 || movie.popularity) && (
          <div className="business-grid">
            {movie.budget > 0 && <div><span>Production budget</span><strong>{formatMoney(movie.budget)}</strong></div>}
            {movie.revenue > 0 && <div><span>Worldwide revenue</span><strong>{formatMoney(movie.revenue)}</strong></div>}
            {movie.budget > 0 && movie.revenue > 0 && <div><span>Revenue / budget</span><strong>{(movie.revenue / movie.budget).toFixed(2)}×</strong></div>}
            {!!movie.popularity && <div><span>TMDB popularity</span><strong>{movie.popularity.toFixed(1)}</strong></div>}
          </div>
        )}
        <div className="detail-columns">
          {movie.production_companies.length > 0 && (
            <div>
              <h3>Production companies</h3>
              <div className="company-grid">{movie.production_companies.map((company) => <CompanyCard company={company} key={company.id} />)}</div>
            </div>
          )}
          <div className="language-panel">
            {movie.spoken_languages.length > 0 && <div><h3>Spoken languages</h3><p>{movie.spoken_languages.map((language) => language.english_name).join(", ")}</p></div>}
            {movie.genres.length > 0 && <div><h3>Genres</h3><p className="tag-list">{movie.genres.map((genre) => <Link href={`/discover?genre=${genre.id}`} key={genre.id}>{genre.name}</Link>)}</p></div>}
            {!!movie.keywords?.keywords.length && <div><h3>Keywords</h3><p className="tag-list muted">{movie.keywords.keywords.map((keyword) => <span key={keyword.id}>{keyword.name}</span>)}</p></div>}
          </div>
        </div>
      </section>

      {collection && (
        <section className="collection-section" style={collection.backdrop_path ? { backgroundImage: `url(${imageUrl(collection.backdrop_path, "w1280")})` } : undefined}>
          <div className="collection-wash" />
          <div>
            <p className="eyebrow light">Part of a collection</p>
            <h2>{collection.name}</h2>
            {collection.overview && <p>{collection.overview}</p>}
            <div className="collection-parts">
              {collection.parts.sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999")).map((part) => (
                <Link href={`/movie/${part.id}`} key={part.id}><span>{movieYear(part.release_date)}</span><strong>{part.title}</strong></Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {releases.length > 0 && (
        <section className="reference-section" id="releases">
          <div className="reference-heading">
            <div><p className="eyebrow">Around the world</p><h2>Release dates & certifications</h2></div>
            <span>{releases.length} regions</span>
          </div>
          <div className="release-grid">{releases.slice(0, 6).map((group) => <ReleaseRegion group={group} key={group.iso_3166_1} />)}</div>
          {releases.length > 6 && (
            <details className="data-disclosure">
              <summary>View all regional releases <span>+</span></summary>
              <div className="release-grid expanded">{releases.slice(6).map((group) => <ReleaseRegion group={group} key={group.iso_3166_1} />)}</div>
            </details>
          )}
        </section>
      )}

      {watchRegions.length > 0 && (
        <section className="reference-section">
          <div className="reference-heading">
            <div><p className="eyebrow">Availability</p><h2>Where to watch</h2></div>
            <span>{watchRegions.length} regions</span>
          </div>
          <div className="provider-regions">{watchRegions.slice(0, 2).map(([code, region]) => <ProviderRegion code={code} region={region} key={code} />)}</div>
          {watchRegions.length > 2 && (
            <details className="data-disclosure">
              <summary>View availability in all regions <span>+</span></summary>
              <div className="provider-regions expanded">{watchRegions.slice(2).map(([code, region]) => <ProviderRegion code={code} region={region} key={code} />)}</div>
            </details>
          )}
          <p className="attribution">Streaming availability data provided by JustWatch via TMDB. Availability changes by location and time.</p>
        </section>
      )}

      {(alternativeTitles.length > 0 || translations.length > 0) && (
        <section className="reference-section">
          <div className="reference-heading">
            <div><p className="eyebrow">Known around the world</p><h2>Titles & translations</h2></div>
          </div>
          {alternativeTitles.length > 0 && (
            <details className="data-disclosure">
              <summary>Alternative titles ({alternativeTitles.length}) <span>+</span></summary>
              <div className="title-table">
                {alternativeTitles.map((title, index) => <div key={`${title.iso_3166_1}-${title.title}-${index}`}><span>{regionName(title.iso_3166_1)}</span><strong>{title.title}</strong><small>{title.type}</small></div>)}
              </div>
            </details>
          )}
          {translations.length > 0 && (
            <details className="data-disclosure">
              <summary>Translations ({translations.length}) <span>+</span></summary>
              <div className="title-table">
                {translations.map((translation, index) => (
                  <div key={`${translation.iso_639_1}-${translation.iso_3166_1}-${index}`}>
                    <span>{translation.english_name} · {translation.iso_3166_1}</span>
                    <strong>{translation.data.title || movie.title}</strong>
                    <small>{translation.data.tagline}</small>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {videos.length > 0 && (
        <section className="reference-section" id="media">
          <div className="reference-heading">
            <div><p className="eyebrow">From the archive</p><h2>Videos</h2></div>
            <span>{videos.length} videos</span>
          </div>
          <div className="video-grid">
            {videos.slice(0, 6).map((video) => (
              <a href={`https://www.youtube.com/watch?v=${video.key}`} target="_blank" rel="noreferrer" key={video.id}>
                <div><img src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`} alt="" loading="lazy" /><span className="media-play"><i /></span></div>
                <h3>{video.name}</h3><p>{video.type}{video.official ? " · Official" : ""}</p>
              </a>
            ))}
          </div>
          {videos.length > 6 && (
            <details className="data-disclosure gallery-disclosure">
              <summary>Expand {videos.length - 6} more videos <span>↓</span></summary>
              <div className="video-grid expanded-media">
                {videos.slice(6).map((video) => (
                <a href={`https://www.youtube.com/watch?v=${video.key}`} target="_blank" rel="noreferrer" key={video.id}>
                  <div><img src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`} alt="" loading="lazy" /><span className="media-play"><i /></span></div>
                  <h3>{video.name}</h3><p>{video.type}{video.official ? " · Official" : ""}</p>
                </a>
              ))}
              </div>
            </details>
          )}
        </section>
      )}

      {(backdrops.length > 0 || posters.length > 0 || logos.length > 0) && (
        <section className="reference-section" id="artwork">
          <div className="reference-heading">
            <div><p className="eyebrow">The visual archive</p><h2>Posters, backdrops & logos</h2></div>
            <span>{backdrops.length + posters.length + logos.length} artworks</span>
          </div>
          {backdrops.length > 0 && (
            <div className="gallery-block">
              <h3>Backdrops <span>{backdrops.length}</span></h3>
              <div className="backdrop-gallery">{backdrops.slice(0, 8).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} target="_blank" rel="noreferrer" key={image.file_path}><img src={imageUrl(image.file_path, "w780") ?? ""} alt="" loading="lazy" /></a>)}</div>
              {backdrops.length > 8 && <details className="data-disclosure gallery-disclosure"><summary>Expand {backdrops.length - 8} more backdrops <span>↓</span></summary><div className="backdrop-gallery expanded-media">{backdrops.slice(8).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} target="_blank" rel="noreferrer" key={image.file_path}><img src={imageUrl(image.file_path, "w780") ?? ""} alt="" loading="lazy" /></a>)}</div></details>}
            </div>
          )}
          {posters.length > 0 && (
            <div className="gallery-block">
              <h3>Posters <span>{posters.length}</span></h3>
              <div className="poster-gallery">{posters.slice(0, 16).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} target="_blank" rel="noreferrer" key={image.file_path}><img src={imageUrl(image.file_path, "w342") ?? ""} alt="" loading="lazy" /></a>)}</div>
              {posters.length > 16 && <details className="data-disclosure gallery-disclosure"><summary>Expand {posters.length - 16} more posters <span>↓</span></summary><div className="poster-gallery expanded-media">{posters.slice(16).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} target="_blank" rel="noreferrer" key={image.file_path}><img src={imageUrl(image.file_path, "w342") ?? ""} alt="" loading="lazy" /></a>)}</div></details>}
            </div>
          )}
          {logos.length > 0 && (
            <div className="gallery-block">
              <h3>Logos <span>{logos.length}</span></h3>
              <div className="logo-gallery">{logos.slice(0, 12).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} target="_blank" rel="noreferrer" key={image.file_path}><img src={imageUrl(image.file_path, "w500") ?? ""} alt={`${movie.title} logo`} loading="lazy" /></a>)}</div>
              {logos.length > 12 && <details className="data-disclosure gallery-disclosure"><summary>Expand {logos.length - 12} more logos <span>↓</span></summary><div className="logo-gallery expanded-media">{logos.slice(12).map((image) => <a href={imageUrl(image.file_path, "original") ?? "#"} target="_blank" rel="noreferrer" key={image.file_path}><img src={imageUrl(image.file_path, "w500") ?? ""} alt={`${movie.title} logo`} loading="lazy" /></a>)}</div></details>}
            </div>
          )}
        </section>
      )}

      {reviews.length > 0 && (
        <section className="reference-section" id="reviews">
          <div className="reference-heading">
            <div><p className="eyebrow">From the community</p><h2>User reviews</h2></div>
            <span>{movie.reviews?.total_results ?? reviews.length} on TMDB</span>
          </div>
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-meta"><div><strong>{review.author_details.name || review.author}</strong><span>@{review.author_details.username}</span></div>{review.author_details.rating != null && <b><span aria-hidden="true">★</span> {rating(review.author_details.rating)}</b>}</div>
                <p>{review.content}</p>
                <div><time dateTime={review.created_at}>{formatDate(review.created_at)}</time><a href={review.url} target="_blank" rel="noreferrer">Original review ↗</a></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <MovieRail eyebrow="More like this" title="Similar films" movies={movie.similar?.results ?? []} />
      <MovieRail eyebrow="Stay for another" title="Recommended next" movies={movie.recommendations?.results ?? []} />
    </div>
  );
}
