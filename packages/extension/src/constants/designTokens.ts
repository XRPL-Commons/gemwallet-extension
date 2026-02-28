// Raw palette inspired by xrpl-commons.org design language
export const palette = {
  navy: '#000D2E',
  navyLight: '#0A1A3A',
  navyMid: '#0F2040',
  navyDark: '#0A1533',
  blue: '#00A8E8',
  blueDark: '#0090C8',
  pink: '#FF006E',
  orange: '#FF9500',
  purple: '#7C3AED',
  yellow: '#FFFF00',
  green: '#22C55E',
  greenDark: '#16A34A',
  red: '#EF4444',
  redDark: '#DC2626',
  cream: '#F5F1E8',
  white: '#FFFFFF',
  black: '#000000'
} as const;

export interface SemanticTokens {
  background: {
    default: string;
    paper: string;
    elevated: string;
    overlay: string;
  };
  surface: {
    primary: string;
    secondary: string;
    hover: string;
    active: string;
    border: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  action: {
    primary: string;
    primaryHover: string;
    secondary: string;
    danger: string;
    success: string;
    warning: string;
  };
  accent: {
    blue: string;
    pink: string;
    purple: string;
    orange: string;
    yellow: string;
    green: string;
  };
  nav: {
    background: string;
    indicator: string;
    border: string;
    shadow: string;
  };
  chart: {
    primary: string;
    gradient: string;
    grid: string;
  };
}

export const darkTokens: SemanticTokens = {
  background: {
    default: palette.navy,
    paper: palette.navyLight,
    elevated: '#142850',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  surface: {
    primary: palette.navyMid,
    secondary: '#1A2D50',
    hover: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.12)'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    disabled: 'rgba(255, 255, 255, 0.38)'
  },
  action: {
    primary: palette.blue,
    primaryHover: '#33B9ED',
    secondary: '#2D3748',
    danger: palette.red,
    success: palette.green,
    warning: palette.orange
  },
  accent: {
    blue: palette.blue,
    pink: palette.pink,
    purple: palette.purple,
    orange: palette.orange,
    yellow: palette.yellow,
    green: palette.green
  },
  nav: {
    background: palette.navyDark,
    indicator: palette.blue,
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 -2px 15px rgba(0, 0, 0, 0.35)'
  },
  chart: {
    primary: palette.blue,
    gradient: 'rgba(0, 168, 232, 0.2)',
    grid: 'rgba(255, 255, 255, 0.06)'
  }
};

export const lightTokens: SemanticTokens = {
  background: {
    default: palette.cream,
    paper: palette.white,
    elevated: palette.white,
    overlay: 'rgba(0, 0, 0, 0.4)'
  },
  surface: {
    primary: palette.white,
    secondary: '#F7F8FA',
    hover: 'rgba(0, 0, 0, 0.04)',
    active: 'rgba(0, 0, 0, 0.08)',
    border: 'rgba(0, 0, 0, 0.12)'
  },
  text: {
    primary: palette.navy,
    secondary: '#4A5568',
    disabled: 'rgba(0, 0, 0, 0.38)'
  },
  action: {
    primary: palette.blueDark,
    primaryHover: '#007AB5',
    secondary: '#E2E8F0',
    danger: palette.redDark,
    success: palette.greenDark,
    warning: palette.orange
  },
  accent: {
    blue: palette.blueDark,
    pink: palette.pink,
    purple: palette.purple,
    orange: palette.orange,
    yellow: '#E6C800',
    green: palette.greenDark
  },
  nav: {
    background: palette.white,
    indicator: palette.blueDark,
    border: 'rgba(0, 0, 0, 0.08)',
    shadow: '0 -2px 15px rgba(0, 0, 0, 0.08)'
  },
  chart: {
    primary: palette.blueDark,
    gradient: 'rgba(0, 144, 200, 0.15)',
    grid: 'rgba(0, 0, 0, 0.06)'
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24
} as const;

export const typography = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700
} as const;
