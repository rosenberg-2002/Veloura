import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/types";

const ITEMS_PER_GROUP = 2;

type SearchResponse<T> = { results: T[] };

type PersonSearchResult = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  known_for?: Array<{ title?: string; name?: string }>;
};

type CompanySearchResult = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
};

type SuggestionKind = "movie" | "person" | "production";

type SearchSuggestion = {
  id: number;
  kind: SuggestionKind;
  title: string;
  subtitle: string;
  imagePath: string | null;
  href: string;
};

type SuggestionGroup = {
  label: string;
  items: SearchSuggestion[];
};

function searchHref(query: string, type: "people" | "productions"): string {
  return `/search?q=${encodeURIComponent(query)}&type=${type}`;
}

function movieSuggestions(results: MovieSummary[]): SearchSuggestion[] {
  return results.slice(0, ITEMS_PER_GROUP).map((movie) => ({
    id: movie.id,
    kind: "movie",
    title: movie.title,
    subtitle: movie.release_date?.slice(0, 4) || "Film",
    imagePath: movie.poster_path,
    href: `/movie/${movie.id}`,
  }));
}

function personSuggestions(results: PersonSearchResult[]): SearchSuggestion[] {
  return results.slice(0, ITEMS_PER_GROUP).map((person) => ({
    id: person.id,
    kind: "person",
    title: person.name,
    subtitle: person.known_for?.[0]?.title || person.known_for?.[0]?.name || person.known_for_department || "Person",
    imagePath: person.profile_path,
    href: searchHref(person.name, "people"),
  }));
}

function companySuggestions(results: CompanySearchResult[]): SearchSuggestion[] {
  return results.slice(0, ITEMS_PER_GROUP).map((company) => ({
    id: company.id,
    kind: "production",
    title: company.name,
    subtitle: company.origin_country || "Production company",
    imagePath: company.logo_path,
    href: searchHref(company.name, "productions"),
  }));
}

function fulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) || "";

  if (query.length < 2) {
    return NextResponse.json({ groups: [] satisfies SuggestionGroup[] });
  }

  const [movieResult, personResult, companyResult] = await Promise.allSettled([
    tmdbFetch<SearchResponse<MovieSummary>>("/search/movie", { query, page: 1, include_adult: false }),
    tmdbFetch<SearchResponse<PersonSearchResult>>("/search/person", { query, page: 1, include_adult: false }),
    tmdbFetch<SearchResponse<CompanySearchResult>>("/search/company", { query, page: 1 }),
  ]);

  const movies = fulfilledValue(movieResult);
  const people = fulfilledValue(personResult);
  const companies = fulfilledValue(companyResult);
  const groups: SuggestionGroup[] = [
    { label: "Movies", items: movies ? movieSuggestions(movies.results) : [] },
    { label: "People", items: people ? personSuggestions(people.results) : [] },
    { label: "Productions", items: companies ? companySuggestions(companies.results) : [] },
  ].filter((group) => group.items.length > 0);

  return NextResponse.json(
    { groups },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
