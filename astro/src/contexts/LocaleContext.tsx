/**
 * Locale Context for React Components
 *
 * Provides the current locale to React components when needed.
 * This is useful for locale-aware formatting (dates, numbers) or debugging.
 *
 * For translations: Pass translated strings as props from Astro components.
 * Astro components use Starlight's useTranslations() to get translations,
 * then pass the translated strings to React components.
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
 * ```tsx
 * function MyComponent() {
 *   const { locale } = useLocale();
 *   // Use locale for formatting, not for translations
 *   const date = new Date().toLocaleDateString(locale);
 *   return <div>{date}</div>;
 * }
 * ```
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
 * Wrap React components to provide locale context.
 *
 * @example
 * ```astro
 * ---
 * // In an Astro component:
 * import { useTranslations } from '@astrojs/starlight/utils/translations';
 * import { LocaleProvider } from '../contexts/LocaleContext';
 * import ReactNav from '../components/navigation/ReactNav';
 *
 * const t = useTranslations(Astro);
 * const currentLocale = Astro.currentLocale || 'en';
 *
 * // Get translations in Astro, pass to React as props
 * const translations = {
 *   signIn: t('auth.signIn'),
 *   signOut: t('auth.signOut'),
 *   // ... other translations
 * };
 * ---
 *
 * <LocaleProvider locale={currentLocale} client:load>
 *   <ReactNav translations={translations} />
 * </LocaleProvider>
 * ```
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
	return (
		<LocaleContext.Provider value={{ locale }}>
			{children}
		</LocaleContext.Provider>
	);
}
