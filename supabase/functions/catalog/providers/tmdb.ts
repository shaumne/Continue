import { ApiError } from '../_shared/errors.ts';
import { fetchWithRetry } from '../_shared/http.ts';
import type { ContentType, NormalizedItem, Provider } from '../types.ts';

const BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date?: string;
  genre_ids: number[];
  vote_average: number;
  original_language: string;
}

interface TmdbTv {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  first_air_date?: string;
  genre_ids: number[];
  vote_average: number;
  original_language: string;
}

interface TmdbSearchResponse<T> {
  results: T[];
}

/** TMDB provider — movies and TV. Uses a v4 bearer token from TMDB_TOKEN. */
export const tmdb: Provider = {
  async search(type: ContentType, query: string, locale: string) {
    if (type !== 'movie' && type !== 'tv') {
      throw new ApiError(
        `TMDB does not support type "${type}"`,
        400,
        'tmdb',
        false,
      );
    }

    const token = Deno.env.get('TMDB_TOKEN');
    if (!token) {
      throw new ApiError('TMDB_TOKEN is not configured', 500, 'tmdb', false);
    }

    // v4 read tokens are JWTs (contain dots) -> Bearer header.
    // v3 keys are 32-char hex -> api_key query param.
    const isV4 = token.includes('.');

    let url =
      `${BASE}/search/${type}?query=${encodeURIComponent(query)}` +
      `&language=${encodeURIComponent(locale)}&include_adult=false&page=1`;
    const headers: Record<string, string> = { accept: 'application/json' };
    if (isV4) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      url += `&api_key=${encodeURIComponent(token)}`;
    }

    const res = await fetchWithRetry(url, { headers }, { provider: 'tmdb' });

    if (type === 'movie') {
      const data = (await res.json()) as TmdbSearchResponse<TmdbMovie>;
      return data.results.map(normalizeMovie);
    }
    const data = (await res.json()) as TmdbSearchResponse<TmdbTv>;
    return data.results.map(normalizeTv);
  },
};

function normalizeMovie(m: TmdbMovie): NormalizedItem {
  return {
    type: 'movie',
    external_source: 'tmdb',
    external_id: String(m.id),
    title: m.title,
    cover_url: m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
    metadata: {
      overview: m.overview,
      release_date: m.release_date ?? null,
      genre_ids: m.genre_ids,
      vote_average: m.vote_average,
      original_language: m.original_language,
    },
  };
}

function normalizeTv(t: TmdbTv): NormalizedItem {
  return {
    type: 'tv',
    external_source: 'tmdb',
    external_id: String(t.id),
    title: t.name,
    cover_url: t.poster_path ? `${IMAGE_BASE}${t.poster_path}` : null,
    metadata: {
      overview: t.overview,
      first_air_date: t.first_air_date ?? null,
      genre_ids: t.genre_ids,
      vote_average: t.vote_average,
      original_language: t.original_language,
    },
  };
}
