/**
 * AIDA Design Token System - TypeScript Definitions
 * Following Design Tokens Community Group (DTCG) Standards
 * 
 * These types provide autocomplete and type safety for design tokens
 * defined in globals.css
 */

// === SPACING TOKENS ===
export type SpacingToken = 
  | 'spacing-0'
  | 'spacing-1'
  | 'spacing-2'
  | 'spacing-3'
  | 'spacing-4'
  | 'spacing-5'
  | 'spacing-6'
  | 'spacing-8'
  | 'spacing-10'
  | 'spacing-12'
  | 'spacing-16'
  | 'spacing-20'
  | 'spacing-24';

// === ANIMATION TOKENS ===
export type DurationToken = 
  | 'duration-instant'
  | 'duration-fast'
  | 'duration-normal'
  | 'duration-slow'
  | 'duration-slower'
  | 'duration-slowest';

export type EasingToken = 
  | 'easing-linear'
  | 'easing-ease'
  | 'easing-ease-in'
  | 'easing-ease-out'
  | 'easing-ease-in-out'
  | 'easing-bounce'
  | 'easing-fluid'
  | 'easing-snappy';

// === TYPOGRAPHY TOKENS ===
export type FontSizeToken = 
  | 'font-size-xs'
  | 'font-size-sm'
  | 'font-size-base'
  | 'font-size-lg'
  | 'font-size-xl'
  | 'font-size-2xl'
  | 'font-size-3xl'
  | 'font-size-4xl'
  | 'font-size-5xl'
  | 'font-size-6xl';

export type LineHeightToken = 
  | 'line-height-tight'
  | 'line-height-snug'
  | 'line-height-normal'
  | 'line-height-relaxed'
  | 'line-height-loose';

export type LetterSpacingToken = 
  | 'letter-spacing-tighter'
  | 'letter-spacing-tight'
  | 'letter-spacing-normal'
  | 'letter-spacing-wide'
  | 'letter-spacing-wider'
  | 'letter-spacing-widest';

// === BORDER RADIUS TOKENS ===
export type RadiusToken = 
  | 'radius-none'
  | 'radius-sm'
  | 'radius-base'
  | 'radius-md'
  | 'radius-lg'
  | 'radius-xl'
  | 'radius-2xl'
  | 'radius-3xl'
  | 'radius-full';

// === SHADOW TOKENS ===
export type ShadowToken = 
  | 'shadow-none'
  | 'shadow-sm'
  | 'shadow-base'
  | 'shadow-md'
  | 'shadow-lg'
  | 'shadow-xl'
  | 'shadow-2xl'
  | 'shadow-inner';

// === AIDA BRAND COLOR TOKENS ===
export type AidaColorToken = 
  | 'aida-primary'
  | 'aida-primary-light'
  | 'aida-primary-dark'
  | 'aida-secondary'
  | 'aida-accent'
  | 'aida-success'
  | 'aida-warning'
  | 'aida-error';

// === COMBINED DESIGN TOKEN TYPES ===
export type DesignToken = 
  | SpacingToken
  | DurationToken
  | EasingToken
  | FontSizeToken
  | LineHeightToken
  | LetterSpacingToken
  | RadiusToken
  | ShadowToken
  | AidaColorToken;

// === UTILITY FUNCTIONS ===

/**
 * Get CSS custom property value for a design token
 * @param token - The design token name
 * @returns CSS custom property string (e.g., 'var(--spacing-4)')
 */
export function getTokenVar(token: DesignToken): string {
  return `var(--${token})`;
}

/**
 * Create a CSS custom property object for React styles
 * @param tokens - Object mapping CSS properties to design tokens
 * @returns CSS-in-JS style object
 */
export function createTokenStyles(tokens: Record<string, DesignToken>): Record<string, string> {
  const styles: Record<string, string> = {};
  
  for (const [property, token] of Object.entries(tokens)) {
    styles[property] = getTokenVar(token);
  }
  
  return styles;
}

// === TRANSITION HELPERS ===

/**
 * Create a transition string using design tokens
 * @param property - CSS property to transition
 * @param duration - Duration token
 * @param easing - Easing token
 * @returns CSS transition string
 */
export function createTransition(
  property: string,
  duration: DurationToken = 'duration-normal',
  easing: EasingToken = 'easing-ease-out'
): string {
  return `${property} ${getTokenVar(duration)} ${getTokenVar(easing)}`;
}

// === ANIMATION PRESETS ===
export const ANIMATION_PRESETS = {
  // Micro-interactions
  hover: createTransition('all', 'duration-fast', 'easing-ease-out'),
  focus: createTransition('all', 'duration-fast', 'easing-ease-out'),
  
  // UI state changes
  modal: createTransition('all', 'duration-normal', 'easing-ease-in-out'),
  slide: createTransition('transform', 'duration-normal', 'easing-fluid'),
  
  // Feedback animations
  bounce: createTransition('transform', 'duration-slow', 'easing-bounce'),
  smooth: createTransition('all', 'duration-slower', 'easing-ease-in-out'),
} as const;

// === SPACING SCALE ===
export const SPACING_SCALE = {
  none: 'spacing-0',
  xs: 'spacing-1',
  sm: 'spacing-2',
  md: 'spacing-4',
  lg: 'spacing-6',
  xl: 'spacing-8',
  '2xl': 'spacing-12',
  '3xl': 'spacing-16',
  '4xl': 'spacing-20',
  '5xl': 'spacing-24',
} as const satisfies Record<string, SpacingToken>;

// === TYPOGRAPHY SCALE ===
export const TYPOGRAPHY_SCALE = {
  xs: { size: 'font-size-xs', lineHeight: 'line-height-tight' },
  sm: { size: 'font-size-sm', lineHeight: 'line-height-snug' },
  base: { size: 'font-size-base', lineHeight: 'line-height-normal' },
  lg: { size: 'font-size-lg', lineHeight: 'line-height-normal' },
  xl: { size: 'font-size-xl', lineHeight: 'line-height-relaxed' },
  '2xl': { size: 'font-size-2xl', lineHeight: 'line-height-relaxed' },
  '3xl': { size: 'font-size-3xl', lineHeight: 'line-height-tight' },
  '4xl': { size: 'font-size-4xl', lineHeight: 'line-height-tight' },
  '5xl': { size: 'font-size-5xl', lineHeight: 'line-height-tight' },
  '6xl': { size: 'font-size-6xl', lineHeight: 'line-height-tight' },
} as const;

// === ELEVATION SCALE ===
export const ELEVATION_SCALE = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  base: 'shadow-base',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
} as const satisfies Record<string, ShadowToken>;