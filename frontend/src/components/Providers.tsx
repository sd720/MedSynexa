'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { PhiProvider } from '../context/PhiContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize query client inside state to avoid state leakage across requests (SSR)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PhiProvider>{children}</PhiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
