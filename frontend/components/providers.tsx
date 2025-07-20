'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedbackProvider } from '@/components/ui/feedback-system';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';

// Query Client - create only on client side
let queryClient: QueryClient;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          cacheTime: 10 * 60 * 1000, // 10 minutes
          retry: (failureCount, error: unknown) => {
            if ((error as { status?: number })?.status === 404) return false;
            return failureCount < 2;
          },
        },
      },
    });
  }
  return queryClient;
}

// Main Providers Component
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>{children}</div>;
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FeedbackProvider>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right"
              richColors
              closeButton
              theme="system"
            />
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}