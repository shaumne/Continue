import { ApiError } from './errors.ts';

interface FetchOptions {
  provider: string;
  retries?: number;
  timeoutMs?: number;
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * fetch with timeout + exponential backoff + jitter. Retries only on 429/5xx
 * and network errors; never on 4xx (except 429). Throws a normalized ApiError.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { provider, retries = 3, timeoutMs = 8000 }: FetchOptions,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) return res;

      if (!RETRYABLE.has(res.status) || attempt === retries) {
        throw new ApiError(
          `${provider} responded ${res.status}`,
          res.status,
          provider,
          RETRYABLE.has(res.status),
        );
      }
      // fall through to backoff for retryable statuses
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof ApiError) throw err;
      lastError = err;
      if (attempt === retries) {
        throw new ApiError(
          `${provider} request failed: ${String(err)}`,
          503,
          provider,
          true,
        );
      }
    }

    // backoff: 2^attempt * 200ms + jitter(0-200ms)
    const delay = 2 ** attempt * 200 + Math.floor(Math.random() * 200);
    await new Promise((r) => setTimeout(r, delay));
  }

  throw new ApiError(`${provider} exhausted retries`, 503, provider, true);
}
