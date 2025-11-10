# Custom Starlight Footer

This directory contains the custom footer implementation for the Staryo Starlight site.

## Files

- **AstroStarlightFooter.astro** - The main custom footer component that overrides Starlight's default footer
- **typeFooter.ts** - TypeScript type definitions for footer configuration
- **index.ts** - Export barrel for easy imports

## Overview

The custom footer is configured in `astro.config.mjs` similar to how the SiteTitle component is configured:

```javascript
components: {
  SiteTitle: "./src/components/navigation/SiteTitle.astro",
  Footer: "./src/components/footer/AstroStarlightFooter.astro",
}
```

## Features

The custom footer component supports:

- ✅ **Default Starlight Elements**: EditLink, LastUpdated, and Pagination components
- ✅ **Conditional Rendering**: Show/hide individual footer elements
- ✅ **Custom Links**: Add custom footer links with support for external links
- ✅ **Copyright Text**: Display custom copyright information
- ✅ **Social Links**: Type-safe social media link support
- ✅ **Galaxy Theme Compatibility**: Works seamlessly with starlight-theme-galaxy
- ✅ **Accessibility**: Proper ARIA labels and semantic HTML
- ✅ **Responsive Design**: Adapts to different screen sizes

## Usage

### Basic Configuration

The footer uses a default configuration that matches Starlight's behavior:

```typescript
const config: FooterConfig = {
  showEditLink: true,
  showLastUpdated: true,
  showPagination: true,
  showStarlightCredit: false,
  customLinks: [],
  copyright: undefined,
  className: '',
};
```

### Customizing the Footer

To customize the footer, edit the `config` object in `AstroStarlightFooter.astro`:

```astro
const config: FooterConfig = {
  showEditLink: true,
  showLastUpdated: true,
  showPagination: true,
  showStarlightCredit: false,
  customLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'GitHub', href: 'https://github.com/KBVE/staryo', external: true },
  ],
  copyright: '© 2025 Staryo. All rights reserved.',
  className: 'my-custom-class',
};
```

### Adding Custom Sections

You can extend the footer by adding new sections in the Astro component. The component uses Starlight's CSS layers for proper styling:

```astro
<div class="custom-section sl-flex">
  <!-- Your custom content here -->
</div>
```

## Type Definitions

### FooterConfig

Main configuration interface for the footer:

```typescript
interface FooterConfig {
  showEditLink?: boolean;        // Show edit link
  showLastUpdated?: boolean;     // Show last updated timestamp
  showPagination?: boolean;      // Show pagination controls
  showStarlightCredit?: boolean; // Show "Built with Starlight" credit
  customLinks?: FooterLink[];    // Array of custom links
  copyright?: string;            // Copyright text
  className?: string;            // Additional CSS classes
}
```

### FooterLink

Interface for custom footer links:

```typescript
interface FooterLink {
  label: string;      // Link text
  href: string;       // Link URL
  icon?: string;      // Optional icon name
  external?: boolean; // Open in new tab
  ariaLabel?: string; // Accessibility label
}
```

### SocialLink

Extended interface for social media links:

```typescript
interface SocialLink extends FooterLink {
  platform: 'github' | 'twitter' | 'discord' | 'linkedin' | 'youtube' | 'twitch' | string;
}
```

### FooterSection

Interface for organizing links into sections:

```typescript
interface FooterSection {
  title: string;
  links: FooterLink[];
}
```

## Styling

The footer uses Starlight's CSS layers pattern:

- `@layer starlight.core` - Core structural styles
- `@layer starlight.components` - Component-specific styles

This ensures compatibility with both Starlight's default styling and the Galaxy theme overlay.

### CSS Variables

The footer respects Starlight's CSS custom properties:

- `--sl-text-sm` - Small text size
- `--sl-text-xs` - Extra small text size
- `--sl-color-gray-3` - Gray color for text
- `--sl-color-gray-4` - Lighter gray for secondary text
- `--sl-color-white` - White color for hover states
- `--sl-color-orange` - Accent color for icons

## Future Enhancements

Potential improvements for the footer:

- [ ] Configuration file support (e.g., `footer.config.ts`)
- [ ] Dynamic link generation from data files
- [ ] Newsletter subscription form
- [ ] Multi-column footer layout
- [ ] Social media icon components
- [ ] Localization support for custom content
- [ ] Footer widgets/slots system
- [ ] Conditional rendering based on page type
- [ ] Dark/light mode specific styling

## Examples

### Minimal Footer

```typescript
const config: FooterConfig = {
  showEditLink: false,
  showLastUpdated: false,
  showPagination: true,
  copyright: '© 2025 Staryo',
};
```

### Full-Featured Footer

```typescript
const config: FooterConfig = {
  showEditLink: true,
  showLastUpdated: true,
  showPagination: true,
  customLinks: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
    { label: 'GitHub', href: 'https://github.com/KBVE/staryo', external: true, icon: 'github' },
  ],
  copyright: '© 2025 Staryo. Made with ❤️ by KBVE',
  className: 'enhanced-footer',
};
```

## Integration with Galaxy Theme

The footer is designed to work seamlessly with `starlight-theme-galaxy`. The component:

- Uses transparent backgrounds to show galaxy effects
- Maintains proper z-index layering
- Respects theme color variables
- Adapts to dark mode preferences

## References

- [Starlight Component Overrides](https://starlight.astro.build/guides/overriding-components/)
- [Starlight Overrides Reference](https://starlight.astro.build/reference/overrides/)
- [Default Footer Source](https://github.com/withastro/starlight/blob/main/packages/starlight/components/Footer.astro)
- [Starlight Theme Galaxy](https://github.com/HiDeoo/starlight-theme-galaxy)
