import { QueryClient } from '@tanstack/react-query';

/** Shared React Query client. Tuned for a media tracker: data changes rarely. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
