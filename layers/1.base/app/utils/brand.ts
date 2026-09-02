export const BRAND_COLORS = {
  blue: '#1b7ace',
  blueBright: '#0889e6',
  blueDark: '#035599',
  red: '#d32f2f',
  redDark: '#b71c1c',
  charcoal: '#171717',
  ink: '#0a0a0a'
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
