# Starlight i18n Integration Guide

## Overview

This guide explains how Starlight handles internationalization and how to integrate custom UI translations into your Staryo project.

## Key Finding: Starlight Does NOT Use i18next

Unlike many i18n solutions, **Starlight has its own built-in dictionary-based i18n system**. It does not use i18next under the hood. This makes it:
- More lightweight
- Tightly integrated with Astro
- Simpler to configure

## What's Already Set Up

✅ **Locales configured** in `astro.config.mjs`:
- English (root)
- Spanish (es)
- Japanese (ja)
- Korean (ko)

✅ **Content i18n working**: Documentation pages organized by locale in `src/content/docs/`

✅ **New i18n JSON files** created in `src/i18n/`:
- `en.json` - English translations
- `es.json` - Spanish translations
- `ja.json` - Japanese translations
- `ko.json` - Korean translations
- `index.ts` - Helper functions and exports
- `README.md` - Documentation

## Integration Options

### Option 1: Starlight Configuration (For Starlight UI Extensions)

This method integrates with Starlight's built-in i18n system. Best for extending Starlight's own UI strings.

**Update `astro.config.mjs`:**

```javascript
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { translations } from "./src/i18n";

export default defineConfig({
  integrations: [
    starlight({
      title: "Staryo",
      locales: { /* existing locales */ },

      // Add custom translations
      i18n: translations,

      // Rest of config...
    })
  ]
});
```

Then access in Astro components using Starlight's `useTranslations()`:

```astro
---
import { useTranslations } from '@astrojs/starlight/utils/translations';

const t = useTranslations(Astro);
const signInText = t('auth.signIn');
---

<button>{signInText}</button>
```

### Option 2: Direct Import (For Custom Components)

This method uses your utility functions directly. Best for custom React/Astro components.

#### In Astro Components:

```astro
---
import { t } from '../i18n';

// Get locale from Astro context
const currentLocale = Astro.currentLocale || 'en';
---

<div>
  <h1>{t(currentLocale, 'auth.signIn')}</h1>
  <p>{t(currentLocale, 'session.sharedWorkerInfo')}</p>
</div>
```

#### In React Components:

You'll need to pass the locale as a prop or via context:

```tsx
import { t, replacePlaceholders } from '../i18n';

interface Props {
  locale: 'en' | 'es' | 'ja' | 'ko';
}

export function SignInButton({ locale }: Props) {
  const text = t(locale, 'auth.signInWithGitHub');

  return <button>{text}</button>;
}

// With placeholders
export function SignInWithProvider({ locale, provider }: Props & { provider: string }) {
  const template = t(locale, 'auth.signInWith');
  const text = replacePlaceholders(template, { provider });

  return <button>{text}</button>;
}
```

## Creating a Locale Context for React

For React components, create a context to avoid prop drilling:

```tsx
// src/contexts/LocaleContext.tsx
import { createContext, useContext } from 'react';

type LocaleContextType = {
  locale: 'en' | 'es' | 'ja' | 'ko';
};

const LocaleContext = createContext<LocaleContextType>({ locale: 'en' });

export const useLocale = () => useContext(LocaleContext);

export function LocaleProvider({
  locale,
  children
}: {
  locale: 'en' | 'es' | 'ja' | 'ko';
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale }}>
      {children}
    </LocaleContext.Provider>
  );
}
```

Then wrap your React components:

```astro
---
// In your Astro page/component
import { LocaleProvider } from '../contexts/LocaleContext';
import ReactNav from '../components/navigation/ReactNav';

const currentLocale = Astro.currentLocale || 'en';
---

<LocaleProvider locale={currentLocale} client:load>
  <ReactNav />
</LocaleProvider>
```

Use in React components:

```tsx
import { useLocale } from '../contexts/LocaleContext';
import { t } from '../i18n';

export function MyComponent() {
  const { locale } = useLocale();

  return <button>{t(locale, 'auth.signIn')}</button>;
}
```

## Components That Need Updating

Based on the codebase analysis, these components have hardcoded English strings:

1. **ReactNav.tsx** (`src/components/navigation/ReactNav.tsx`)
   - Sign in modal
   - OAuth provider buttons
   - User status messages
   - Error messages

2. **SiteTitle.astro** (`src/components/navigation/SiteTitle.astro`)
   - Logo aria-label

3. **Auth pages** (`src/pages/auth/*.astro`)
   - callback.astro - Authentication flow messages
   - logout.astro - Sign out messages

4. **useAuthBridge.ts** (`src/components/auth/useAuthBridge.ts`)
   - Error messages

## Example: Updating ReactNav Component

**Before:**
```tsx
<h2>Sign in</h2>
<button>Sign in with GitHub</button>
```

**After:**
```tsx
import { useLocale } from '../contexts/LocaleContext';
import { t } from '../i18n';

export function ReactNav() {
  const { locale } = useLocale();

  return (
    <>
      <h2>{t(locale, 'auth.signIn')}</h2>
      <button>{t(locale, 'auth.signInWithGitHub')}</button>
    </>
  );
}
```

## Translation Keys Reference

### Authentication (`auth.*`)
- `auth.signIn` - "Sign in"
- `auth.signInWithGitHub` - "Sign in with GitHub"
- `auth.signInWithTwitch` - "Sign in with Twitch"
- `auth.signInWithDiscord` - "Sign in with Discord"
- `auth.signOut` - "Sign out"
- `auth.signingOut` - "Signing out..."
- `auth.loggedInAs` - "Logged in as"

### User (`user.*`)
- `user.loading` - "Loading…"
- `user.error` - "Error:"
- `auth.anonymousUser` - "Anonymous user"
- `auth.guestUser` - "Staryo Guest"

### Session (`session.*`)
- `session.sharedWorkerInfo` - Info about SharedWorker
- `session.supabaseInitFailed` - Supabase init error

### Common (`common.*`)
- `common.close` - "Close"
- `common.pleaseWait` - "Please wait"
- `common.redirecting` - "Redirecting to home..."

## Next Steps

1. **Choose integration method** - Pick Option 1 (Starlight) or Option 2 (Direct) based on your needs
2. **Create LocaleContext** - If using React components
3. **Update components** - Replace hardcoded strings with `t()` calls
4. **Test all locales** - Verify translations work in all 4 languages
5. **Add new translations** - As you add new UI strings, add them to all JSON files

## Benefits of This Approach

✅ **Organized** - All translations in dedicated JSON files
✅ **Type-safe** - TypeScript types auto-generated from JSON
✅ **Scalable** - Easy to add new locales or keys
✅ **Consistent** - Single source of truth for all UI strings
✅ **Maintainable** - Translators can work on JSON files without touching code
✅ **Fallback support** - Automatic fallback to English if translation missing

## Resources

- [Starlight i18n Documentation](https://starlight.astro.build/guides/i18n/)
- [Astro i18n Routing](https://docs.astro.build/en/guides/internationalization/)
- Translation files: `src/i18n/*.json`
- Helper functions: `src/i18n/index.ts`
