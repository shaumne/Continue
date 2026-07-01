import { supabase } from '@/lib/supabase';
import type { ContentItem, ContentType } from '@/types/models';

/**
 * Thin client for the `catalog` Supabase Edge Function.
 *
 * The RN app NEVER calls external providers (TMDB/IGDB/AniList/Steam/Google
 * Books) directly — secret keys live in Supabase secrets and the edge function
 * normalizes every response into ContentItem shape. See api-integrator agent.
 */

export type CatalogAction = 'search' | 'details' | 'sync';

interface SearchParams {
  type: ContentType;
  query: string;
  /** Provider locale (e.g. 'tr-TR'). Use toProviderLocale(appLanguage). */
  locale?: string;
}

export async function searchCatalog(params: SearchParams): Promise<ContentItem[]> {
  const { data, error } = await supabase.functions.invoke<ContentItem[]>('catalog', {
    body: { action: 'search', ...params },
  });
  if (error) throw error;
  return data ?? [];
}

export async function getCatalogDetails(
  source: ContentItem['external_source'],
  externalId: string,
): Promise<ContentItem> {
  const { data, error } = await supabase.functions.invoke<ContentItem>('catalog', {
    body: { action: 'details', source, externalId },
  });
  if (error) throw error;
  if (!data) throw new Error('Content not found');
  return data;
}
