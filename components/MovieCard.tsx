import Link from "next/link";
import { imageUrl, movieGenres, movieYear, rating } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/types";

type MovieCardProps = {
  movie: MovieSummary;
  priority?: boolean;
};

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  const poster = imageUrl(movie.poster_path, "w500");
  const genres = movieGenres(movie.genre_ids);

  return (
    <article className="movie-card">
      <Link href={`/movie/${movie.id}`} aria-label={`View ${movie.title}`}>
        <div className="poster-wrap">
          {poster ? (
            <img
              src={poster}
              alt={`${movie.title} poster`}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="poster-placeholder"><span>{movie.title}</span></div>
          )}
          <div className="poster-sheen" />
          <span className="card-rating"><span aria-hidden="true">★</span> {rating(movie.vote_average)}</span>
          <span className="card-play" aria-hidden="true"><i /></span>
        </div>
        <div className="card-copy">
          <h3>{movie.title}</h3>
          <p>
            <span>{movieYear(movie.release_date)}</span>
            {genres.length > 0 && <><i>•</i><span>{genres.join(", ")}</span></>}
          </p>
        </div>
      </Link>
    </article>
  );
}
