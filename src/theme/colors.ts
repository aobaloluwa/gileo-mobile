export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',

  primary: '#111111',
  primaryPressed: '#333333',
  primarySoft: '#F3F3F3',

  text: '#111111',
  textSecondary: '#707070',
  border: '#E5E5E5',
  placeholder: '#A0A0A0',

  error: '#C62828',
  success: '#267346',
  overlay: 'rgba(0, 0, 0, 0.45)',
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
  input: 12,
  card: 16,
  button: 999,
  screen: 24,
} as const;

export const typography = {
  title: 30,
  heading: 24,
  subheading: 18,
  body: 15,
  caption: 13,
  button: 16,
} as const;