/**
 * Example: ReactNav Component with i18n Support
 *
 * This is an example showing how to update the ReactNav component
 * to use the new i18n translation system.
 *
 * Replace hardcoded strings like "Sign in" with translation function calls.
 */

import { useLocale } from '../contexts/LocaleContext';
import { t } from '../i18n';

export function ReactNavI18nExample() {
  const { locale } = useLocale();

  // Example of using basic translations
  const signInText = t(locale, 'auth.signIn');
  const closeText = t(locale, 'common.close');
  const loadingText = t(locale, 'user.loading');

  return (
    <div>
      {/* Sign in modal heading - BEFORE: "Sign in" */}
      <h2>{signInText}</h2>

      {/* OAuth provider buttons - BEFORE: "Sign in with GitHub" */}
      <button>{t(locale, 'auth.signInWithGitHub')}</button>
      <button>{t(locale, 'auth.signInWithTwitch')}</button>
      <button>{t(locale, 'auth.signInWithDiscord')}</button>

      {/* Info text - BEFORE: "The SharedWorker will..." */}
      <p>{t(locale, 'session.sharedWorkerInfo')}</p>

      {/* Status messages */}
      <div>
        {/* BEFORE: "Loading…" */}
        <span>{loadingText}</span>

        {/* BEFORE: "Error:" */}
        <span>{t(locale, 'user.error')}</span>

        {/* BEFORE: "Anonymous user" */}
        <span>{t(locale, 'auth.anonymousUser')}</span>

        {/* BEFORE: "Staryo Guest" */}
        <span>{t(locale, 'auth.guestUser')}</span>

        {/* BEFORE: "Logged in as" */}
        <span>{t(locale, 'auth.loggedInAs')}</span>
      </div>

      {/* Close button - BEFORE: "Close" */}
      <button>{closeText}</button>

      {/* Error messages - BEFORE: "Failed to initialize Supabase" */}
      <div>{t(locale, 'session.supabaseInitFailed')}</div>

      {/* BEFORE: "Sign-in failed" */}
      <div>{t(locale, 'auth.signInFailed')}</div>
    </div>
  );
}

/**
 * Usage in Astro component:
 *
 * ---
 * import { LocaleProvider } from '../contexts/LocaleContext';
 * import { ReactNavI18nExample } from '../examples/ReactNavI18nExample';
 *
 * const currentLocale = Astro.currentLocale || 'en';
 * ---
 *
 * <LocaleProvider locale={currentLocale} client:load>
 *   <ReactNavI18nExample />
 * </LocaleProvider>
 */
