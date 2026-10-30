export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  primary: '#F10505',
  primaryPressed: '#3F0106',
  primarySoft: '#FFF0F0',
  brandAccent: '#F10505',
  brandDark: '#3F0106',
  accent: '#10B981',
  gold: '#ffb703',
  supportingGold: '#ffb703',
  wine: '#3F0106',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderFocus: '#F10505',
  placeholder: '#94A3B8',
  error: '#EF4444',
  success: '#10B981',
  overlay: 'rgba(15, 23, 42, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  input: 16,
  card: 24,
  button: 999,
  screen: 28,
} as const;

export const typography = {
  title: 30,
  heading: 24,
  subheading: 18,
  body: 15,
  caption: 13,
  button: 16,
} as const;

export function formatNaira(amountInNaira: number): string {
  const naira = Math.floor(amountInNaira || 0);
  return '₦' + naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatKobo(priceKobo: number): string {
  return formatNaira(Math.floor((priceKobo || 0) / 100));
}
