import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Default to 0, customize per query hook
      refetchOnWindowFocus: false,
    },
  },
});
