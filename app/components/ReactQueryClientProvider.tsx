'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ReactNode } from 'react';

export default function ReactQueryClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60,
        refetchInterval: 1000 * 60,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
