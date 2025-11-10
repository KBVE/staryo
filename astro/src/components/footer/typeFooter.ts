// Type definitions for custom Starlight footer components

/**
 * Supported social media platforms
 */
export type SocialPlatform =
  | 'github'
  | 'twitter'
  | 'discord'
  | 'linkedin'
  | 'youtube'
  | 'twitch'
  | 'mastodon'
  | 'reddit';

/**
 * Footer layout options
 */
export type FooterLayout = 'default' | 'centered' | 'multi-column';

/**
 * Configuration options for the custom footer
 */
export interface FooterConfig {
  /**
   * Show or hide the edit link
   * @default true
   */
  showEditLink?: boolean;

  /**
   * Show or hide the last updated timestamp
   * @default true
   */
  showLastUpdated?: boolean;

  /**
   * Show or hide the pagination controls
   * @default true
   */
  showPagination?: boolean;

  /**
   * Show or hide the "Built with Starlight" credit
   * @default false
   */
  showStarlightCredit?: boolean;

  /**
   * Custom footer links to display
   */
  customLinks?: FooterLink[];

  /**
   * Social media links to display with icons
   */
  socialLinks?: SocialLink[];

  /**
   * Organized footer sections
   */
  sections?: FooterSection[];

  /**
   * Custom copyright text
   */
  copyright?: string;

  /**
   * Footer layout style
   * @default 'default'
   */
  layout?: FooterLayout;

  /**
   * Additional CSS classes to apply to the footer
   */
  className?: string;

  /**
   * Show footer border top
   * @default true
   */
  showBorder?: boolean;

  /**
   * Enable tooltips on hover
   * @default true
   */
  showTooltips?: boolean;

  /**
   * Use React component for dynamic features
   * @default false
   */
  useReactFooter?: boolean;
}

/**
 * Represents a custom footer link
 */
export interface FooterLink {
  /**
   * The text to display for the link
   */
  label: string;

  /**
   * The URL the link points to
   */
  href: string;

  /**
   * Optional icon name (if using Astro/Starlight icons)
   */
  icon?: string;

  /**
   * Whether to open the link in a new tab
   * @default false
   */
  external?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Tooltip text to display on hover
   */
  tooltip?: string;
}

/**
 * Social media link configuration
 */
export interface SocialLink {
  /**
   * The social platform name
   */
  platform: SocialPlatform;

  /**
   * The URL to the social profile
   */
  href: string;

  /**
   * Custom label for the social link
   * @default Platform name
   */
  label?: string;

  /**
   * ARIA label for accessibility
   * @default "Follow us on {platform}"
   */
  ariaLabel?: string;

  /**
   * Tooltip text to display on hover
   * @default "Follow us on {platform}"
   */
  tooltip?: string;
}

/**
 * Footer section configuration for organizing links
 */
export interface FooterSection {
  /**
   * Section title
   */
  title: string;

  /**
   * Links in this section
   */
  links: FooterLink[];

  /**
   * ARIA label for the section
   */
  ariaLabel?: string;
}
