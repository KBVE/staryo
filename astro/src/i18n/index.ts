/**
 * i18n utilities for working with Starlight's extended translations
 *
 * Translations are now managed through Starlight's content collections system.
 * See src/content/i18n/ for translation files and src/content.config.ts for schema.
 *
 * Usage in Astro components:
 * ```astro
 * ---
 * import { useTranslations } from '@astrojs/starlight/utils/translations';
 * const t = useTranslations(Astro);
 * ---
 * <button>{t('auth.signIn')}</button>
 * ```
 */

/**
 * Type for available locales
 */
export type Locale = 'en' | 'es' | 'ja' | 'ko';

/**
 * Type for custom translation keys
 * These extend Starlight's built-in translation keys
 */
export type CustomTranslationKey =
	// Authentication
	| 'auth.signIn'
	| 'auth.signInWith'
	| 'auth.signInWithGitHub'
	| 'auth.signInWithTwitch'
	| 'auth.signInWithDiscord'
	| 'auth.signOut'
	| 'auth.signingOut'
	| 'auth.signedOut'
	| 'auth.signOutError'
	| 'auth.authenticating'
	| 'auth.completingSignIn'
	| 'auth.authFailed'
	| 'auth.signInFailed'
	| 'auth.oauthSignInFailed'
	| 'auth.signOutFailed'
	| 'auth.loggedInAs'
	| 'auth.anonymousUser'
	| 'auth.guestUser'
	// User
	| 'user.loading'
	| 'user.error'
	// Session
	| 'session.sharedWorkerInfo'
	| 'session.supabaseInitFailed'
	// Common
	| 'common.close'
	| 'common.pleaseWait'
	| 'common.redirecting'
	// Site
	| 'site.logoAlt';

/**
 * Helper to replace placeholders in translation strings
 *
 * @param text - The translation string with placeholders like {provider}
 * @param replacements - Object with key-value pairs for replacements
 * @returns The text with replaced placeholders
 *
 * @example
 * ```ts
 * import { useTranslations } from '@astrojs/starlight/utils/translations';
 * import { replacePlaceholders } from '../i18n';
 *
 * const t = useTranslations(Astro);
 * const template = t('auth.signInWith');
 * const text = replacePlaceholders(template, { provider: 'GitHub' });
 * // Result: 'Sign in with GitHub'
 * ```
 */
export function replacePlaceholders(
	text: string,
	replacements: Record<string, string>
): string {
	return Object.entries(replacements).reduce(
		(result, [key, value]) =>
			result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
		text
	);
}
