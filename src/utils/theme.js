export const colors = {
  background: '#FDF6EE',
  surface: '#FFFFFF',
  border: '#E8D9C8',
  borderLight: '#F0E6D8',

  primary: '#4A2C17',
  primaryLight: '#6B4226',

  accent: '#D4713A',
  accentLight: '#F0956A',

  textPrimary: '#2C1A0E',
  textSecondary: '#7A5C44',
  textMuted: '#A88B6E',

  statePendiente: '#D4713A',
  stateEntregado: '#4A7C3F',
  stateCancelado: '#8A8A8A',

  danger: '#C0392B',
  dangerLight: '#FFECEB',
  success: '#4A7C3F',
  successLight: '#EBF5EB',

  whatsapp: '#25D366',
  pdf: '#1565C0',
};

export const typography = {
  display: {
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  heading: {
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  body: {
    fontFamily: undefined,
    fontWeight: '400',
  },
  label: {
    fontFamily: undefined,
    fontWeight: '500',
  },
  caption: {
    fontFamily: undefined,
    fontWeight: '400',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#4A2C17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: '#4A2C17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const stateColor = (estado) => {
  switch (estado) {
    case 'Entregado': return colors.stateEntregado;
    case 'Cancelado': return colors.stateCancelado;
    default: return colors.statePendiente;
  }
};