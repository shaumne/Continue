import { ApiError } from '../_shared/errors.ts';
import { fetchWithRetry } from '../_shared/http.ts';
import type { ContentType, NormalizedItem, Provider } from '../types.ts';

const TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token';
const GAMES_ENDPOINT = 'https://api.igdb.com/v4/games';
const IMAGE_BASE = 'https://images.igdb.com/igdb/image/upload/t_cover_big';

// Safety margin so we refresh the token slightly before Twitch expires it.
const TOKEN_SAFETY_MARGIN_MS = 60_000;

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface IgdbCover {
  image_id: string;
}

interface IgdbGenre {
  name: string;
}

interface IgdbGame {
  id: number;
  name: string;
  cover?: IgdbCover;
  genres?: IgdbGenre[];
  first_release_date?: number;
  summary?: string;
  total_rating?: number;
}

// Module-level cache: IGDB/Twitch app tokens are valid for ~60 days, so we
// avoid re-authenticating on every search call.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const url =
    `${TOKEN_ENDPOINT}?client_id=${encodeURIComponent(clientId)}` +
    `&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;

  const res = await fetchWithRetry(url, { method: 'POST' }, { provider: 'igdb' });
  const json = (await res.json()) as TwitchTokenResponse;

  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000 - TOKEN_SAFETY_MARGIN_MS,
  };
  return cachedToken.accessToken;
}

/**
 * IGDB provider — games. Requires a Twitch app-access token, obtained via
 * IGDB_CLIENT_ID / IGDB_CLIENT_SECRET secrets. IGDB has no per-locale search
 * variant, so `locale` is intentionally unused.
 */
export const igdb: Provider = {
  async search(type: ContentType, query: string, _locale: string) {
    if (type !== 'game') {
      throw new ApiError(
        `IGDB does not support type "${type}"`,
        400,
        'igdb',
        false,
      );
    }

    const clientId = Deno.env.get('IGDB_CLIENT_ID');
    const clientSecret = Deno.env.get('IGDB_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new ApiError(
        'IGDB is not configured (set IGDB_CLIENT_ID / IGDB_CLIENT_SECRET)',
        500,
        'igdb',
        false,
      );
    }

    const accessToken = await getAccessToken(clientId, clientSecret);
    const escapedQuery = query.replace(/"/g, '\\"');
    const body =
      `search "${escapedQuery}"; ` +
      'fields name, cover.image_id, genres.name, first_release_date, summary, total_rating; ' +
      'limit 15;';

    const res = await fetchWithRetry(
      GAMES_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'text/plain',
        },
        body,
      },
      { provider: 'igdb' },
    );

    const games = (await res.json()) as IgdbGame[];
    return games.map(normalizeGame);
  },
};

function normalizeGame(g: IgdbGame): NormalizedItem {
  return {
    type: 'game',
    external_source: 'igdb',
    external_id: String(g.id),
    title: g.name,
    cover_url: g.cover?.image_id ? `${IMAGE_BASE}/${g.cover.image_id}.jpg` : null,
    metadata: {
      genres: g.genres?.map((genre) => genre.name) ?? [],
      first_release_date: g.first_release_date ?? null,
      summary: g.summary ?? null,
      total_rating: g.total_rating ?? null,
    },
  };
}
