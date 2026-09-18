import { type ReactNode } from 'react';

interface ServerConfig {
  apiUrl: string;
  environment: string;
  version: string;
}

function getServerConfig(): ServerConfig {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };
}

interface ServerProviderProps {
  children: ReactNode;
}

export function ServerProvider({ children }: ServerProviderProps) {
  const config = getServerConfig();

  return <div data-server-config={JSON.stringify(config)}>{children}</div>;
}
