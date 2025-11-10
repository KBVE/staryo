/**
 * Footer components and types for Starlight customization
 */

export type {
  FooterConfig,
  FooterLink,
  SocialLink,
  FooterSection,
  SocialPlatform,
  FooterLayout,
} from './typeFooter';

// Default footer configuration
export const defaultFooterConfig = {
  showEditLink: true,
  showLastUpdated: true,
  showPagination: true,
  showStarlightCredit: false,
  showBorder: true,
  layout: 'default' as const,
  customLinks: [],
  socialLinks: [],
  sections: [],
};
