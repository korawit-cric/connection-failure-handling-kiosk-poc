'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ClientContextValue {
  user: { id: string; name: string } | null;
  isAuthenticated: boolean;
  login: (user: { id: string; name: string }) => void;
  logout: () => void;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
}

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const login = (userData: { id: string; name: string }) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <ClientContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}
