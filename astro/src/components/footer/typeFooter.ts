// Type definitions for custom Starlight footer components

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
   * Custom copyright text
   */
  copyright?: string;

  /**
   * Additional CSS classes to apply to the footer
   */
  className?: string;
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
}

/**
 * Social media link configuration
 */
export interface SocialLink extends FooterLink {
  /**
   * The social platform name (e.g., 'github', 'twitter', 'discord')
   */
  platform: 'github' | 'twitter' | 'discord' | 'linkedin' | 'youtube' | 'twitch' | string;
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
}
