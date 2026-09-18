import { type ReactNode } from 'react';
import { ServerProvider } from './server-provider';
import { ClientProvider } from './client-provider';
import { QueryProvider } from '../lib/query';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ServerProvider>
      <QueryProvider>
        <ClientProvider>{children}</ClientProvider>
      </QueryProvider>
    </ServerProvider>
  );
}
