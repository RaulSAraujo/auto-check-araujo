/**
 * Stitch Design System tokens (Material namedColors + screen specs).
 * Source: assets/18253519892564423504 — keep in sync with labs.google/stitch.
 */
export const STITCH_COLORS = {
  primary: '#005ea4',
  primaryContainer: '#1477cb',
  primaryFixed: '#d3e4ff',
  primaryFixedDim: '#a2c9ff',
  onPrimary: '#ffffff',
  onPrimaryFixed: '#001c38',
  onPrimaryFixedVariant: '#004881',
  surfaceTint: '#0060a8',
  inversePrimary: '#a2c9ff',

  secondary: '#b6171e',
  secondaryContainer: '#da3433',
  onSecondary: '#ffffff',

  tertiary: '#8f4900',
  tertiaryContainer: '#b45e00',
  onTertiary: '#ffffff',

  background: '#fcf9f8',
  surface: '#fcf9f8',
  surfaceBright: '#fcf9f8',
  surfaceDim: '#dcd9d9',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainer: '#f0eded',
  surfaceContainerHigh: '#eae7e7',
  surfaceContainerHighest: '#e5e2e1',
  surfaceVariant: '#e5e2e1',

  onSurface: '#1c1b1b',
  onSurfaceVariant: '#414752',
  onBackground: '#1c1b1b',
  outline: '#717783',
  outlineVariant: '#c0c7d3',
  inverseSurface: '#313030',
  inverseOnSurface: '#f3f0ef',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',

  /** Home finance strip (Stitch screen HTML) */
  success: '#16a34a',
  warning: '#d97706',

  /** Brand panel deep end (login gradient) */
  charcoalDark: '#0a0a0a'
} as const

export const BRAND_COLORS = {
  blue: STITCH_COLORS.primary,
  blueBright: STITCH_COLORS.primaryContainer,
  blueDark: STITCH_COLORS.onPrimaryFixedVariant,
  red: STITCH_COLORS.secondary,
  redDark: '#930010',
  charcoal: STITCH_COLORS.onSurface,
  ink: STITCH_COLORS.charcoalDark
} as const

export const BRAND = {
  businessName: 'Araujo Auto Center',
  location: 'Franca/SP',
  tagline: 'Acesso exclusivo para colaboradores da oficina.',
  facebookUrl: 'https://www.facebook.com/araujoautocenterfrancasp/',
  logoSrc: '/logo.png?v=3',
  brandIconSrc: '/brand-icon.png?v=1',
  logoAlt: 'Araujo Auto Center, Franca/SP'
} as const

export const BRAND_DISPLAY_NAME = `${BRAND.businessName}, ${BRAND.location}`
