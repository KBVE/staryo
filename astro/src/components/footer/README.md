# Custom Starlight Footer

A fully-featured, responsive, and accessible footer component for Astro Starlight sites with social media integration and extensive customization options.

## Files

- **AstroStarlightFooter.astro** - Main footer component with responsive design and accessibility features
- **SocialIcon.astro** - SVG icon component for social media platforms
- **typeFooter.ts** - TypeScript type definitions for footer configuration
- **index.ts** - Export barrel for easy imports
- **README.md** - This documentation

## Overview

The custom footer is configured in `astro.config.mjs` similar to the SiteTitle component:

```javascript
components: {
  SiteTitle: "./src/components/navigation/SiteTitle.astro",
  Footer: "./src/components/footer/AstroStarlightFooter.astro",
}
```

## Features

### Core Features
- ✅ **Default Starlight Elements**: EditLink, LastUpdated, and Pagination components
- ✅ **Conditional Rendering**: Show/hide individual footer elements
- ✅ **Custom Links**: Add custom footer links with external link indicators
- ✅ **Social Media Icons**: Built-in SVG icons for 8 major platforms
- ✅ **Multi-Section Support**: Organize links into categorized sections
- ✅ **Copyright Text**: Display custom copyright information
- ✅ **Layout Options**: Default, centered, and multi-column layouts

### Design & Accessibility
- ✅ **Fully Responsive**: Mobile-first design with tablet and desktop optimizations
- ✅ **Accessibility**: Comprehensive ARIA labels, semantic HTML, keyboard navigation
- ✅ **Theme Integration**: Extensive use of Starlight CSS variables
- ✅ **Galaxy Theme Compatible**: Transparent backgrounds, backdrop filters
- ✅ **Reduced Motion**: Respects `prefers-reduced-motion` preference
- ✅ **High Contrast**: Enhanced visibility in high contrast mode
- ✅ **Print Styles**: Clean footer formatting for printing

### Responsive Breakpoints
- **Mobile**: < 768px (base styles)
- **Tablet**: ≥ 768px (2-column sections, larger social icons)
- **Desktop**: ≥ 1024px (3-column sections, increased spacing)
- **Large Desktop**: ≥ 1280px (4-column sections)

## Configuration

### Basic Setup

Edit the `config` object in `AstroStarlightFooter.astro` (lines 22-39):

```typescript
const config: FooterConfig = {
  showEditLink: true,
  showLastUpdated: true,
  showPagination: true,
  showStarlightCredit: false,
  showBorder: true,
  layout: 'default',
  customLinks: [],
  socialLinks: [],
  sections: [],
  copyright: undefined,
  className: '',
};
```

### Adding Social Media Links

Uncomment and customize the `socialLinks` array:

```typescript
socialLinks: [
  { platform: 'github', href: 'https://github.com/KBVE/staryo' },
  { platform: 'discord', href: 'https://discord.gg/yourserver' },
  { platform: 'twitter', href: 'https://twitter.com/youraccount' },
  { platform: 'linkedin', href: 'https://linkedin.com/company/yourcompany' },
  { platform: 'youtube', href: 'https://youtube.com/@yourchannel' },
],
```

**Supported Platforms:**
- GitHub
- Twitter/X
- Discord
- LinkedIn
- YouTube
- Twitch
- Mastodon
- Reddit

### Custom Footer Links

Add simple navigation links:

```typescript
customLinks: [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact', href: '/contact' },
  {
    label: 'GitHub',
    href: 'https://github.com/KBVE/staryo',
    external: true,
    ariaLabel: 'View source code on GitHub'
  },
],
```

### Multi-Section Footer

Create organized footer sections:

```typescript
sections: [
  {
    title: 'Product',
    ariaLabel: 'Product links',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Community', href: 'https://discord.gg/yourserver', external: true },
      { label: 'Contact', href: '/contact' },
    ],
  },
],
```

### Layout Options

Choose from three layout styles:

```typescript
layout: 'default'       // Standard layout
layout: 'centered'      // All content centered
layout: 'multi-column'  // Optimized for many sections
```

### Copyright Notice

```typescript
copyright: '© 2025 Staryo. Built with ❤️ by KBVE'
```

## Complete Configuration Example

```typescript
const config: FooterConfig = {
  showEditLink: true,
  showLastUpdated: true,
  showPagination: true,
  showStarlightCredit: false,
  showBorder: true,
  layout: 'default',

  customLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ],

  socialLinks: [
    { platform: 'github', href: 'https://github.com/KBVE/staryo' },
    { platform: 'discord', href: 'https://discord.gg/yourserver' },
    { platform: 'twitter', href: 'https://twitter.com/kbve' },
  ],

  sections: [
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'Blog', href: '/blog' },
        { label: 'Examples', href: '/examples' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Discord', href: 'https://discord.gg/yourserver', external: true },
        { label: 'GitHub', href: 'https://github.com/KBVE', external: true },
        { label: 'Forum', href: '/forum' },
      ],
    },
  ],

  copyright: '© 2025 Staryo. All rights reserved.',
  className: 'my-custom-footer',
};
```

## Type Definitions

### FooterConfig

```typescript
interface FooterConfig {
  showEditLink?: boolean;
  showLastUpdated?: boolean;
  showPagination?: boolean;
  showStarlightCredit?: boolean;
  socialLinks?: SocialLink[];
  sections?: FooterSection[];
  customLinks?: FooterLink[];
  copyright?: string;
  layout?: FooterLayout;
  className?: string;
  showBorder?: boolean;
}
```

### SocialLink

```typescript
interface SocialLink {
  platform: SocialPlatform;  // 'github' | 'twitter' | 'discord' | ...
  href: string;
  label?: string;
  ariaLabel?: string;
}
```

### FooterLink

```typescript
interface FooterLink {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  ariaLabel?: string;
}
```

### FooterSection

```typescript
interface FooterSection {
  title: string;
  links: FooterLink[];
  ariaLabel?: string;
}
```

## Starlight Theme Variables Used

The footer extensively uses Starlight's CSS custom properties for consistent theming:

### Typography
- `--sl-text-xs` - Extra small text (copyright, credit)
- `--sl-text-sm` - Small text (links, meta)
- `--sl-text-base` - Base text (section titles)
- `--sl-line-height` - Standard line height
- `--sl-line-height-headings` - Heading line height
- `--sl-font-weight-semibold` - Semibold font weight

### Colors
- `--sl-color-white` - White text
- `--sl-color-gray-3` - Primary gray text
- `--sl-color-gray-4` - Secondary gray text
- `--sl-color-gray-5` - Background hover state
- `--sl-color-gray-6` - Background default
- `--sl-color-accent` - Accent color (focus outlines)
- `--sl-color-orange` - Orange accent (Starlight icon)
- `--sl-color-hairline` - Border color

### Spacing
- `--sl-content-pad-x` - Horizontal content padding
- `--sl-content-pad-y` - Vertical content padding
- `--sl-nav-gap` - Navigation gap spacing

### Effects
- `--sl-ease` - Easing function for transitions
- `--sl-border-radius` - Border radius for rounded corners

## Responsive Design Details

### Mobile (< 768px)
- Single column layout
- Stacked sections
- Compact social icons (2.5rem)
- Reduced spacing
- Touch-friendly targets

### Tablet (≥ 768px)
- 2-column section grid
- Larger social icons (3rem)
- Increased spacing
- Better visual hierarchy

### Desktop (≥ 1024px)
- 3-column section grid
- Maximum spacing
- Optimized for wide screens
- Enhanced hover effects

### Large Desktop (≥ 1280px)
- 4-column section grid
- Maximum layout width
- Spacious design

## Accessibility Features

### ARIA Labels
- Footer has `role="contentinfo"` and `aria-label="Site footer"`
- Navigation sections have `role="navigation"`
- Link groups have appropriate `aria-label` attributes
- Social links include "Follow us on {platform}" labels
- External link indicators use `aria-hidden="true"`

### Keyboard Navigation
- All links are keyboard accessible
- Focus states use accent color outline
- Logical tab order
- Skip to content compatibility

### Screen Readers
- Semantic HTML (`<footer>`, `<nav>`, `<ul>`, `<li>`)
- Descriptive link text
- External link announcements
- Section headings for navigation

### Visual Accessibility
- High contrast mode support
- Sufficient color contrast ratios
- Focus visible states
- No color-only indicators

### Motion Preferences
- Respects `prefers-reduced-motion`
- Disables animations when requested
- Static hover states available

## Customization Tips

### Custom Styling

Add custom CSS classes:

```typescript
className: 'my-footer enhanced-mode'
```

### Conditional Content

Conditionally show elements:

```typescript
showEditLink: false,  // Hide edit link on production
showBorder: false,    // Remove top border
```

### Advanced Layout

For complex footers:

```typescript
layout: 'multi-column',
sections: [
  // 4+ sections for wide layouts
],
```

## Galaxy Theme Integration

The footer is optimized for `starlight-theme-galaxy`:

- Transparent backgrounds let galaxy effects show through
- Backdrop blur for readability
- Proper z-index layering
- Dark mode optimizations
- RGBA color support for semi-transparent backgrounds

## Performance Considerations

- SVG icons are inline (no HTTP requests)
- CSS is scoped and minimal
- No JavaScript required
- Lazy loading compatible
- Print-optimized styles

## Browser Support

Works in all modern browsers supporting:
- CSS Grid
- CSS Custom Properties
- Flexbox
- Media Queries Level 5

## Future Enhancements

Potential improvements:

- [ ] Configuration file support (`footer.config.ts`)
- [ ] Newsletter subscription component
- [ ] Dynamic content loading
- [ ] Footer widgets/slots system
- [ ] Theme switcher integration
- [ ] Language selector integration
- [ ] Animated gradient backgrounds
- [ ] More social platform icons

## References

- [Starlight Component Overrides](https://starlight.astro.build/guides/overriding-components/)
- [Starlight Overrides Reference](https://starlight.astro.build/reference/overrides/)
- [Default Footer Source](https://github.com/withastro/starlight/blob/main/packages/starlight/components/Footer.astro)
- [Starlight Theme Galaxy](https://github.com/HiDeoo/starlight-theme-galaxy)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For issues or questions:
- Check the [Starlight documentation](https://starlight.astro.build/)
- Review the type definitions in `typeFooter.ts`
- Inspect the component source in `AstroStarlightFooter.astro`
- Test with different configurations

---

**Note**: Remember to customize the social links and content to match your project before deployment!
