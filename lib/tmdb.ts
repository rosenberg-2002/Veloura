import type { Genre, GenreResponse, MoviePageResponse } from "./types";

const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;

const MOVIE_GENRES: Readonly<Record<number, string>> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Science Fiction",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10770: "TV Movie",
};

export type TmdbParameter = string | number | boolean | null | undefined;
export type TmdbParameters = Readonly<Record<string, TmdbParameter>>;

export type TmdbErrorCode = "configuration" | "network" | "response";

export class TmdbError extends Error {
  readonly code: TmdbErrorCode;
  readonly status?: number;

  constructor(message: string, code: TmdbErrorCode, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "TmdbError";
    this.code = code;
    this.status = options?.status;
  }
}

type TmdbCredentials = {
  apiKey?: string;
  readAccessToken?: string;
};

function credentials(): TmdbCredentials {
  const readAccessToken = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!readAccessToken && !apiKey) {
    throw new TmdbError(
      "Configure TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY before requesting TMDB.",
      "configuration",
    );
  }

  return { apiKey, readAccessToken };
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request<T>(url: URL, readAccessToken?: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const headers = new Headers({ Accept: "application/json" });
      if (readAccessToken) headers.set("Authorization", `Bearer ${readAccessToken}`);

      const response = await fetch(url, {
        headers,
        next: { revalidate: 1_800 },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new TmdbError(
          `TMDB returned HTTP ${response.status}.`,
          "response",
          { status: response.status },
        );
        if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) throw error;
        lastError = error;
      } else {
        return await response.json() as T;
      }
    } catch (error) {
      if (error instanceof TmdbError && !isRetryableStatus(error.status ?? 0)) throw error;
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
    } finally {
      clearTimeout(timeout);
    }

    await wait(250 * attempt);
  }

  if (lastError instanceof TmdbError) throw lastError;
  throw new TmdbError("TMDB could not be reached after retrying.", "network", { cause: lastError });
}

export async function tmdbFetch<T>(path: string, parameters: TmdbParameters = {}): Promise<T> {
  if (!path.startsWith("/")) {
    throw new TmdbError("TMDB paths must begin with a slash.", "configuration");
  }

  const { apiKey, readAccessToken } = credentials();
  const query = new URLSearchParams({ language: "en-US" });
  if (!readAccessToken && apiKey) query.set("api_key", apiKey);

  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  return request<T>(new URL(`${API_BASE}${path}?${query.toString()}`), readAccessToken);
}

export function getMoviePage(path: string, parameters: TmdbParameters = {}): Promise<MoviePageResponse> {
  return tmdbFetch<MoviePageResponse>(path, parameters);
}

export async function getGenres(): Promise<Genre[]> {
  const response = await tmdbFetch<GenreResponse>("/genre/movie/list");
  return response.genres;
}

export function imageUrl(path: string | null | undefined, size = "w500"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function movieYear(date: string | null | undefined): string {
  return date?.slice(0, 4) || "TBA";
}

export function movieGenres(ids: readonly number[] = [], limit = 2): string[] {
  return ids.slice(0, limit).map((id) => MOVIE_GENRES[id]).filter((name): name is string => Boolean(name));
}

export function rating(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value.toFixed(1) : "NR";
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes || minutes < 1) return "Runtime TBA";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}
