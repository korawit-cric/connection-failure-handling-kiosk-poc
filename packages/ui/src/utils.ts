import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Custom text utility classes from design system (e.g., text-desktop-body1, text-mobile-h1)
// These are defined using @utility directive in shared-styles.css
const customTextUtilities = [
  'desktop-h1',
  'desktop-h2',
  'desktop-h3',
  'desktop-h4',
  'desktop-body1',
  'desktop-body2',
  'desktop-caption',
  'mobile-h1',
  'mobile-h2',
  'mobile-h3',
  'mobile-h4',
  'mobile-body1',
  'mobile-body2',
  'mobile-caption',
] as const;

/**
 * Why this configuration is needed:
 * tailwind-merge needs to recognize our custom text utilities (text-desktop-*, text-mobile-*)
 * so it doesn't strip them out when merging classes. Without this, custom classes like
 * "text-desktop-body1" would be removed during class merging.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: customTextUtilities }],
    },
  },
});

/**
 * Utility to merge class names with Tailwind conflict resolution.
 * NOTE: Custom text utilities (text-desktop-*, text-mobile-*) are preserved
 * because they're registered in the tailwind-merge configuration above.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
