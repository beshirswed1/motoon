'use client';

import { type ReactNode, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { makeStore, type AppStore } from '@/store';
import { MaintenanceGuard } from './MaintenanceGuard';
import { offlineSyncService } from '@/services/firebase/offlineSync.service';
import { AuthProvider } from '@/context/AuthContext';
import { PWAProvider } from '@/contexts/PWAContext';
import { FavoritesProvider } from '@/hooks/useFavorites';

/* ── Query Client factory — one instance per request ─────── */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on window focus — avoids UX noise in Arabic IME
        refetchOnWindowFocus: false,
        // Stale time: 5 minutes default
        staleTime: 5 * 60 * 1000,
        // Cache time: 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests twice
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: reuse the same client to avoid recreating on re-renders
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/* ── Providers ────────────────────────────────────────────── */
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  // Redux store — use ref to ensure single instance per component lifecycle
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    // Initialize offline sync listener once store is created
    offlineSyncService.initialize(storeRef.current);
  }

  return (
    <ReduxProvider store={storeRef.current}>
      <AuthProvider>
        <FavoritesProvider>
        <PWAProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>

            {/* Toast notifications — RTL position */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: 'IBM Plex Sans Arabic, Tahoma, sans-serif',
                  direction: 'rtl',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#0F766E', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </ThemeProvider>

          {/* React Query DevTools — only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          )}
        </QueryClientProvider>
        </PWAProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
