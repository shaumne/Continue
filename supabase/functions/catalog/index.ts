import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from './_shared/cors.ts';
import { ApiError } from './_shared/errors.ts';
import { anilist } from './providers/anilist.ts';
import { googleBooks } from './providers/googlebooks.ts';
import { igdb } from './providers/igdb.ts';
import { tmdb } from './providers/tmdb.ts';
import type { ContentType, NormalizedItem, Provider } from './types.ts';

// Provider registry. api-integrator extends this as sources are added.
const PROVIDERS: Partial<Record<ContentType, Provider>> = {
  movie: tmdb,
  tv: tmdb,
  anime: anilist,
  book: googleBooks,
  game: igdb,
};

interface RequestBody {
  action: 'search' | 'details' | 'sync';
  type?: ContentType;
  query?: string;
  locale?: string; // provider locale, e.g. 'tr-TR'; client maps app language.
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (body.action !== 'search') {
      throw new ApiError(
        `Unsupported action "${body.action}"`,
        400,
        'catalog',
        false,
      );
    }
    if (!body.type || !body.query?.trim()) {
      throw new ApiError('type and query are required', 400, 'catalog', false);
    }

    const provider = PROVIDERS[body.type];
    if (!provider) {
      throw new ApiError(
        `No provider for type "${body.type}"`,
        400,
        'catalog',
        false,
      );
    }

    const locale = body.locale ?? 'en-US';
    const items: NormalizedItem[] = await provider.search(
      body.type,
      body.query.trim(),
      locale,
    );

    // Upsert into the shared catalog with the service role (bypasses RLS),
    // deduped by (external_source, external_id). Return rows incl. their ids.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('content_items')
      .upsert(items, { onConflict: 'external_source,external_id' })
      .select();

    if (error) {
      throw new ApiError(`catalog upsert failed: ${error.message}`, 500, 'catalog', false);
    }

    return jsonResponse(data ?? []);
  } catch (err) {
    if (err instanceof ApiError) {
      return jsonResponse(err.toResponseBody(), err.status);
    }
    return jsonResponse(
      { error: String(err), provider: 'catalog', retryable: false },
      500,
    );
  }
});
