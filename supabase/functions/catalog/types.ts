// Provider-agnostic shape every provider normalizes to. Mirrors an insert into
// the `content_items` table (see src/types/models.ts on the client side).

export type ContentType =
  | 'game'
  | 'movie'
  | 'tv'
  | 'book'
  | 'anime'
  | 'podcast'
  | 'youtube'
  | 'course';

export type ExternalSource =
  | 'tmdb'
  | 'anilist'
  | 'igdb'
  | 'steam'
  | 'google_books';

export interface NormalizedItem {
  type: ContentType;
  external_source: ExternalSource;
  external_id: string;
  title: string;
  cover_url: string | null;
  metadata: Record<string, unknown>;
}

/** Every provider module implements this. */
export interface Provider {
  search(type: ContentType, query: string, locale: string): Promise<NormalizedItem[]>;
}
