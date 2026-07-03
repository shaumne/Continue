import { ApiError } from '../_shared/errors.ts';
import { fetchWithRetry } from '../_shared/http.ts';
import type { ContentType, NormalizedItem, Provider } from '../types.ts';

const ENDPOINT = 'https://graphql.anilist.co';

// AniList search results are language-agnostic (romaji/english/native titles
// come back together in one response) — there's no per-locale variant to
// request, so the `locale` param passed into `search()` is intentionally
// unused here.
const SEARCH_QUERY = `
query ($q: String, $perPage: Int) {
  Page(perPage: $perPage) {
    media(search: $q, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
      }
      episodes
      format
      genres
      averageScore
      description(asHtml: false)
      seasonYear
    }
  }
}
`;

interface AniListTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

interface AniListMedia {
  id: number;
  title: AniListTitle;
  coverImage: { large: string | null } | null;
  episodes: number | null;
  format: string | null;
  genres: string[];
  averageScore: number | null;
  description: string | null;
  seasonYear: number | null;
}

interface AniListResponse {
  data: {
    Page: {
      media: AniListMedia[];
    };
  } | null;
  errors?: Array<{ message: string; status?: number }>;
}

/** AniList provider — anime, public GraphQL API, no auth required. */
export const anilist: Provider = {
  async search(type: ContentType, query: string, _locale: string) {
    if (type !== 'anime') {
      throw new ApiError(
        `AniList does not support type "${type}"`,
        400,
        'anilist',
        false,
      );
    }

    const res = await fetchWithRetry(
      ENDPOINT,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: SEARCH_QUERY,
          variables: { q: query, perPage: 15 },
        }),
      },
      { provider: 'anilist' },
    );

    const json = (await res.json()) as AniListResponse;

    if (json.errors?.length) {
      const first = json.errors[0];
      throw new ApiError(
        `anilist responded with GraphQL error: ${first.message}`,
        first.status ?? 400,
        'anilist',
        false,
      );
    }

    const media = json.data?.Page.media ?? [];
    return media.map(normalizeAnime);
  },
};

function normalizeAnime(m: AniListMedia): NormalizedItem {
  const title = m.title.english ?? m.title.romaji ?? m.title.native ?? 'Unknown';
  return {
    type: 'anime',
    external_source: 'anilist',
    external_id: String(m.id),
    title,
    cover_url: m.coverImage?.large ?? null,
    metadata: {
      episodes: m.episodes,
      format: m.format,
      genres: m.genres,
      averageScore: m.averageScore,
      description: m.description,
      seasonYear: m.seasonYear,
    },
  };
}
