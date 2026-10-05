'use client';

import { createContext, useContext, type ReactNode } from 'react';

// Dados que vários componentes precisam (botão de WhatsApp, datas...).
export type AppContextValue = {
  /** Data de hoje no fuso do negócio: 'AAAA-MM-DD' */
  today: string;
  userName: string;
  companyName: string;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>.');
  return ctx;
}
