import { ApiError } from '../_shared/errors.ts';
import { fetchWithRetry } from '../_shared/http.ts';
import type { ContentType, NormalizedItem, Provider } from '../types.ts';

const BASE = 'https://www.googleapis.com/books/v1/volumes';

interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  pageCount?: number;
  categories?: string[];
  publishedDate?: string;
  description?: string;
  averageRating?: number;
}

interface GoogleBooksVolume {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

/**
 * Google Books provider — books. API key is optional (works unauthenticated
 * at a lower quota); set GOOGLE_BOOKS_KEY to raise the quota, don't require it.
 */
export const googleBooks: Provider = {
  async search(type: ContentType, query: string, locale: string) {
    if (type !== 'book') {
      throw new ApiError(
        `Google Books does not support type "${type}"`,
        400,
        'google_books',
        false,
      );
    }

    const langRestrict = locale.split('-')[0];
    let url =
      `${BASE}?q=${encodeURIComponent(query)}&maxResults=15` +
      `&langRestrict=${encodeURIComponent(langRestrict)}`;

    const key = Deno.env.get('GOOGLE_BOOKS_KEY');
    if (key) {
      url += `&key=${encodeURIComponent(key)}`;
    }

    const res = await fetchWithRetry(
      url,
      { headers: { accept: 'application/json' } },
      { provider: 'google_books' },
    );

    const data = (await res.json()) as GoogleBooksSearchResponse;
    if (!data.items?.length) {
      return [];
    }
    return data.items.map(normalizeBook);
  },
};

function normalizeBook(v: GoogleBooksVolume): NormalizedItem {
  const info = v.volumeInfo;
  const thumbnail = info.imageLinks?.thumbnail ?? null;
  return {
    type: 'book',
    external_source: 'google_books',
    external_id: v.id,
    title: info.title,
    cover_url: thumbnail ? thumbnail.replace(/^http:/, 'https:') : null,
    metadata: {
      authors: info.authors ?? [],
      pageCount: info.pageCount ?? null,
      categories: info.categories ?? [],
      publishedDate: info.publishedDate ?? null,
      description: info.description ?? null,
      averageRating: info.averageRating ?? null,
    },
  };
}
