export const colors = {
  ivory: '#F7F3EC',
  white: '#FFFFFF',
  sand: '#EDE6DA',
  ink: '#14213D',
  inkMuted: '#5B6478',
  brand: '#1B4F8F',
  brandDark: '#14386B',
  brandSoft: '#E7EEF6',
  laiton: '#B8894A',
  border: '#DDD5C7',
  error: '#B42318',
  success: '#1F7A4D',
  warning: '#8A6A1E',
  disabled: '#A9A29A',
} as const;

export const radius = {
  field: 8,
  control: 8,
  card: 12,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const fieldHeight = 48;
export const borderWidth = 1;
export const focusRingWidth = 2;

export const tokens = {
  colors,
  radius,
  fontSize,
  fieldHeight,
  borderWidth,
  focusRingWidth,
} as const;

export default tokens;