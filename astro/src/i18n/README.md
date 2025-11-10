# Starlight i18n Custom Translations

This directory contains custom UI string translations that extend Starlight's built-in i18n system.

## Structure

```
i18n/
├── en.json          # English (root locale)
├── es.json          # Spanish
├── ja.json          # Japanese
├── ko.json          # Korean
├── index.ts         # Main export and utility functions
└── README.md        # This file
```

## How Starlight i18n Works

**Important:** Starlight does NOT use i18next. It has its own built-in dictionary-based i18n system.

Starlight provides two ways to handle translations:

1. **Built-in UI translations** - Pre-translated strings for navigation, search, TOC, etc.
2. **Custom UI strings** - Your own translations added via configuration or helper functions

## Integration Methods

### Method 1: Direct Configuration (Recommended for Starlight Built-ins)

Add custom translations directly in `astro.config.mjs`:

```javascript
import { translations } from './src/i18n';

export default defineConfig({
  integrations: [
    starlight({
      locales: { /* your locales */ },
      i18n: translations  // Import from JSON files
    })
  ]
});
```

### Method 2: Utility Functions (For React/Astro Components)

Use the helper functions in your components:

#### In Astro Components:

```astro
---
import { t } from '../i18n';

// Get current locale from Astro
const locale = Astro.currentLocale || 'en';
const signInText = t(locale, 'auth.signIn');
---

<button>{signInText}</button>
```

#### In React Components:

```tsx
import { t } from '../i18n';

// You'll need to pass locale as a prop or get it from context
function MyComponent({ locale }: { locale: string }) {
  return <button>{t(locale, 'auth.signIn')}</button>;
}
```

## Translation Keys

All translation keys follow a namespace pattern:

- `auth.*` - Authentication related strings
- `user.*` - User-related strings
- `session.*` - Session management strings
- `common.*` - Common UI strings
- `site.*` - Site-wide strings

### Examples:

- `auth.signIn` → "Sign in"
- `auth.signInWithGitHub` → "Sign in with GitHub"
- `common.close` → "Close"
- `user.loading` → "Loading…"

## Adding New Translations

1. Add the new key-value pair to all locale files (en.json, es.json, ja.json, ko.json)
2. Update the TypeScript types by importing the files in `index.ts` (types auto-generate from en.json)
3. Use the translation in your components with `t(locale, 'your.key')`

## Placeholders

Some translations support placeholders:

```json
{
  "auth.signInWith": "Sign in with {provider}"
}
```

Use the `replacePlaceholders` helper:

```typescript
import { t, replacePlaceholders } from '../i18n';

const text = t('en', 'auth.signInWith');
const final = replacePlaceholders(text, { provider: 'GitHub' });
// Result: "Sign in with GitHub"
```

## Best Practices

1. **Always add translations to ALL locale files** - Don't leave any locale behind
2. **Use namespaces** - Keep keys organized (auth., user., etc.)
3. **Fallback to English** - The `t()` function automatically falls back to English if a translation is missing
4. **Keep keys consistent** - Use the same structure across all locales
5. **Avoid hardcoded strings** - Always use translation keys in components

## Future Expansion

This structure makes it easy to:
- Add new locales (just create a new JSON file and add to index.ts)
- Add new translation keys (add to all JSON files)
- Create locale-specific variations
- Integrate with Starlight's routing and content collections

## Resources

- [Starlight i18n Documentation](https://starlight.astro.build/guides/i18n/)
- [Astro i18n Routing](https://docs.astro.build/en/guides/internationalization/)
