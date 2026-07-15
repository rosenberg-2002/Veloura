export type MovieSummary = {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
};

export type Genre = {
  id: number;
  name: string;
};

export type CastMember = {
  id: number;
  name: string;
  original_name?: string;
  character: string;
  profile_path: string | null;
  order?: number;
  known_for_department?: string;
  credit_id?: string;
};

export type CrewMember = {
  id: number;
  name: string;
  original_name?: string;
  department: string;
  job: string;
  profile_path: string | null;
  known_for_department?: string;
  credit_id?: string;
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
  size?: number;
};

export type ProductionCompany = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

export type ProductionCountry = {
  iso_3166_1: string;
  name: string;
};

export type SpokenLanguage = {
  english_name: string;
  iso_639_1: string;
  name: string;
};

export type CollectionSummary = {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
};

export type CollectionDetails = CollectionSummary & {
  overview: string;
  parts: MovieSummary[];
};

export type AlternativeTitle = {
  iso_3166_1: string;
  title: string;
  type: string;
};

export type ExternalIds = {
  imdb_id: string | null;
  wikidata_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
};

export type ImageAsset = {
  file_path: string;
  aspect_ratio: number;
  height: number;
  width: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
};

export type Keyword = {
  id: number;
  name: string;
};

export type ReleaseDate = {
  certification: string;
  descriptors?: string[];
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
};

export type ReleaseDateGroup = {
  iso_3166_1: string;
  release_dates: ReleaseDate[];
};

export type Review = {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
};

export type WatchProvider = {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
};

export type WatchRegion = {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
};

export type Translation = {
  iso_3166_1: string;
  iso_639_1: string;
  name: string;
  english_name: string;
  data: {
    homepage: string;
    overview: string;
    runtime: number;
    tagline: string;
    title: string;
  };
};

export type MovieDetails = MovieSummary & {
  adult: boolean;
  belongs_to_collection: CollectionSummary | null;
  tagline: string;
  runtime: number | null;
  genres: Genre[];
  status: string;
  budget: number;
  revenue: number;
  homepage: string | null;
  imdb_id: string | null;
  origin_country: string[];
  original_language: string;
  original_title: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  recommendations?: { results: MovieSummary[] };
  similar?: { results: MovieSummary[] };
  alternative_titles?: { titles: AlternativeTitle[] };
  external_ids?: ExternalIds;
  images?: { backdrops: ImageAsset[]; logos: ImageAsset[]; posters: ImageAsset[] };
  keywords?: { keywords: Keyword[] };
  release_dates?: { results: ReleaseDateGroup[] };
  reviews?: { page: number; results: Review[]; total_pages: number; total_results: number };
  translations?: { translations: Translation[] };
  "watch/providers"?: { results: Record<string, WatchRegion> };
};

export type MoviePageResponse = {
  page: number;
  results: MovieSummary[];
  total_pages: number;
  total_results: number;
};

export type GenreResponse = {
  genres: Genre[];
};
