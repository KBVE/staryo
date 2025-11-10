/**
 * Locale Context for React Components
 *
 * Provides the current locale to all child React components,
 * avoiding the need to pass locale as props through multiple levels.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '../i18n';

interface LocaleContextType {
  locale: Locale;
}

const LocaleContext = createContext<LocaleContextType>({ locale: 'en' });

/**
 * Hook to access the current locale in React components
 *
 * @example
 * function MyComponent() {
 *   const { locale } = useLocale();
 *   return <div>{t(locale, 'auth.signIn')}</div>;
 * }
 */
export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

interface LocaleProviderProps {
  locale: Locale;
  children: ReactNode;
}

/**
 * Locale Provider Component
 *
 * Wrap your React components with this provider to give them access to the current locale.
 *
 * @example
 * // In an Astro component:
 * ---
 * import { LocaleProvider } from '../contexts/LocaleContext';
 * import ReactNav from '../components/navigation/ReactNav';
 *
 * const currentLocale = Astro.currentLocale || 'en';
 * ---
 *
 * <LocaleProvider locale={currentLocale} client:load>
 *   <ReactNav />
 * </LocaleProvider>
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return (
    <LocaleContext.Provider value={{ locale }}>
      {children}
    </LocaleContext.Provider>
  );
}
