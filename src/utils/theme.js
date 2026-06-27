export const colors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  border: '#E6E0D8',
  borderLight: '#EDE9E4',

  primary: '#3D2B1F',
  primaryLight: '#5C4033',

  accent: '#B85C38',
  accentLight: '#D4795A',

  textPrimary: '#1E1208',
  textSecondary: '#6B5748',
  textMuted: '#9E8C80',

  statePendiente: '#B85C38',
  stateEntregado: '#3D6B47',
  stateCancelado: '#8A8480',

  danger: '#A63228',
  dangerLight: '#FDECEA',
  success: '#3D6B47',
  successLight: '#EAF2EC',

  whatsapp: '#25D366',
  pdf: '#1A56A0',
};

export const typography = {
  display: {
    fontWeight: '700',
  },
  heading: {
    fontWeight: '500',
  },
  body: {
    fontWeight: '400',
  },
  label: {
    fontWeight: '500',
  },
  caption: {
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
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  fab: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
};

export const stateColor = (estado) => {
  switch (estado) {
    case 'Entregado': return colors.stateEntregado;
    case 'Cancelado': return colors.stateCancelado;
    default: return colors.statePendiente;
  }
};