import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovieEncyclopedia } from "@/components/movie/MovieEncyclopedia";
import { StatusPanel } from "@/components/StatusPanel";
import { formatRuntime, imageUrl, movieYear, rating, TmdbError, tmdbFetch } from "@/lib/tmdb";
import type { CollectionDetails, MovieDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

type MoviePageProps = {
  params: Promise<{ id: string }>;
};

function parseMovieId(id: string): string | null {
  if (!/^[1-9]\d*$/.test(id)) return null;
  const numericId = Number(id);
  return Number.isSafeInteger(numericId) ? String(numericId) : null;
}

async function getMovie(id: string) {
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    append_to_response: "credits,videos,recommendations,similar,alternative_titles,external_ids,images,keywords,release_dates,reviews,translations,watch/providers",
    include_image_language: "en,null",
  });
}

async function getCollection(id: number) {
  return tmdbFetch<CollectionDetails>(`/collection/${id}`);
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (!movieId) return { title: "Movie not found" };

  try {
    const movie = await getMovie(movieId);
    return {
      title: movie.title,
      description: movie.overview || `Discover ${movie.title} on Veloura.`,
    };
  } catch {
    return { title: "Movie" };
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (!movieId) notFound();

  let movie: MovieDetails;
  try {
    movie = await getMovie(movieId);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) notFound();
    return <main className="page-shell"><StatusPanel title="We couldn’t load this film" message="TMDB may be temporarily unavailable. Please refresh and try again." /></main>;
  }

  const collection = movie.belongs_to_collection
    ? await getCollection(movie.belongs_to_collection.id).catch(() => null)
    : null;
    const backdrop = imageUrl(movie.backdrop_path, "original");
    const poster = imageUrl(movie.poster_path, "w780");
    const trailer = movie.videos?.results.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)
      ?? movie.videos?.results.find((video) => video.site === "YouTube" && video.type === "Trailer");
    const providerRegions = movie["watch/providers"]?.results ?? {};
    const configuredRegion = process.env.TMDB_REGION?.trim().toUpperCase() || "US";
    const preferredRegion = providerRegions[configuredRegion] ?? providerRegions.US ?? Object.values(providerRegions)[0];
    const streamingProviders = preferredRegion
      ? [...(preferredRegion.flatrate ?? []), ...(preferredRegion.free ?? []), ...(preferredRegion.ads ?? [])]
      : [];
    const paidProviders = preferredRegion
      ? [...(preferredRegion.rent ?? []), ...(preferredRegion.buy ?? [])]
      : [];
    const featuredProviders = Array.from(
      new Map((streamingProviders.length ? streamingProviders : paidProviders).map((provider) => [provider.provider_id, provider])).values(),
    ).slice(0, 3);
    const providerNames = featuredProviders.map((provider) => provider.provider_name).join(", ");
    const providerAction = streamingProviders.length ? "Watch on" : "Available on";

  return (
      <main className="movie-detail">
        <section className="detail-hero" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}>
          <div className="detail-wash" />
          <div className="content-shell detail-hero-inner">
            <Link className="back-link" href="/discover">← Back to discover</Link>
            <div className="detail-copy">
              <p className="eyebrow light">Complete movie reference</p>
              <h1>{movie.title}</h1>
              {movie.tagline && <p className="tagline">“{movie.tagline}”</p>}
              <div className="hero-meta detail-meta">
                <span className="hero-rating"><span aria-hidden="true">★</span> {rating(movie.vote_average)}</span>
                <span>{movieYear(movie.release_date)}</span>
                <span>{formatRuntime(movie.runtime)}</span>
                {movie.genres.slice(0, 3).map((genre) => <span key={genre.id}>{genre.name}</span>)}
              </div>
              <p className="detail-overview">{movie.overview || "No synopsis is available for this film yet."}</p>
              <div className="hero-actions">
                {trailer && (
                  <a className="button button-primary" href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                    <span className="play-mini" aria-hidden="true" /> Watch trailer
                  </a>
                )}
                <a className="button button-ghost" href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer">View on TMDB</a>
              </div>
              {preferredRegion && featuredProviders.length > 0 && (
                <div className="watch-cta-row">
                  <span>{streamingProviders.length ? "Now streaming" : "Digital release"}</span>
                  <div>
                    <span className="watch-provider-names">{providerAction} {providerNames}</span>
                    <a href={preferredRegion.link} target="_blank" rel="noreferrer">See watch options on TMDB ↗</a>
                  </div>
                </div>
              )}
            </div>
            <div className="detail-poster">
              {poster ? <img src={poster} alt={`${movie.title} poster`} /> : <div className="poster-placeholder"><span>{movie.title}</span></div>}
            </div>
          </div>
        </section>

        <div className="content-shell detail-content compact-detail-content">
          <section className="film-facts" aria-label="Film details">
            <div><span>Audience score</span><strong>{rating(movie.vote_average)}<small>/10</small></strong></div>
            <div><span>Ratings</span><strong>{movie.vote_count.toLocaleString()}</strong></div>
            <div><span>Runtime</span><strong>{formatRuntime(movie.runtime)}</strong></div>
            <div><span>Release</span><strong>{movie.release_date || "TBA"}</strong></div>
          </section>
        </div>
        <MovieEncyclopedia movie={movie} collection={collection} />
      </main>
  );
}
