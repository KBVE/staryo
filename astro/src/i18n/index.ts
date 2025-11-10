/**
 * i18n translations for custom UI strings
 * These extend Starlight's built-in translations
 */

import en from './en.json';
import es from './es.json';
import ja from './ja.json';
import ko from './ko.json';

/**
 * Translation dictionaries for each locale
 */
export const translations = {
  en,
  es,
  ja,
  ko,
} as const;

/**
 * Type for available locales
 */
export type Locale = keyof typeof translations;

/**
 * Type for translation keys
 */
export type TranslationKey = keyof typeof en;

/**
 * Helper function to get a translation for a specific locale
 * @param locale - The locale code (en, es, ja, ko)
 * @param key - The translation key (e.g., 'auth.signIn')
 * @param fallback - Optional fallback text if translation is missing
 * @returns The translated string
 */
export function t(locale: Locale, key: TranslationKey, fallback?: string): string {
  const translation = translations[locale]?.[key];
  if (translation) return translation;

  // Fallback to English if translation is missing
  const enTranslation = translations.en[key];
  if (enTranslation) return enTranslation;

  // Return fallback or key if nothing found
  return fallback ?? key;
}

/**
 * Helper to replace placeholders in translation strings
 * @param text - The translation string with placeholders like {provider}
 * @param replacements - Object with key-value pairs for replacements
 * @returns The text with replaced placeholders
 *
 * @example
 * replacePlaceholders('Sign in with {provider}', { provider: 'GitHub' })
 * // Returns: 'Sign in with GitHub'
 */
export function replacePlaceholders(
  text: string,
  replacements: Record<string, string>
): string {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    text
  );
}

export default translations;
