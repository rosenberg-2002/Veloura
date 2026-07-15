import Link from "next/link";
import type { MovieSummary } from "@/lib/types";
import { MovieCard } from "./MovieCard";

type MovieRailProps = {
  eyebrow?: string;
  title: string;
  movies: MovieSummary[];
  href?: string;
  priorityCount?: number;
};

export function MovieRail({ eyebrow, title, movies, href = "/discover", priorityCount = 0 }: MovieRailProps) {
  if (!movies.length) return null;

  return (
    <section className="movie-section">
      <div className="section-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        <Link className="text-link" href={href}>View all <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="movie-rail">
        {movies.slice(0, 12).map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} priority={index < priorityCount} />
        ))}
      </div>
    </section>
  );
}
