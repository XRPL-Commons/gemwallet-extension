import { createTheme, Theme } from '@mui/material/styles';

import {
  darkTokens,
  lightTokens,
  borderRadius,
  spacing,
  typography as typoTokens,
  SemanticTokens
} from '../constants/designTokens';

// Extend MUI Theme to include gemTokens
declare module '@mui/material/styles' {
  interface Theme {
    gemTokens: SemanticTokens;
  }
  interface ThemeOptions {
    gemTokens?: SemanticTokens;
  }
}

export function createGemTheme(mode: 'light' | 'dark'): Theme {
  const tokens = mode === 'dark' ? darkTokens : lightTokens;

  return createTheme({
    gemTokens: tokens,
    spacing: spacing.sm,
    shape: {
      borderRadius: borderRadius.md
    },
    palette: {
      mode,
      primary: {
        main: tokens.action.primary
      },
      secondary: {
        main: tokens.action.secondary
      },
      error: {
        main: tokens.action.danger
      },
      success: {
        main: tokens.action.success
      },
      warning: {
        main: tokens.action.warning
      },
      background: {
        default: tokens.background.default,
        paper: tokens.background.paper
      },
      text: {
        primary: tokens.text.primary,
        secondary: tokens.text.secondary,
        disabled: tokens.text.disabled
      }
    },
    typography: {
      fontFamily: typoTokens.fontFamily,
      fontWeightLight: typoTokens.fontWeightLight,
      fontWeightRegular: typoTokens.fontWeightRegular,
      fontWeightMedium: typoTokens.fontWeightMedium,
      fontWeightBold: typoTokens.fontWeightBold
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background.default
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.pill,
            textTransform: 'none' as const,
            fontWeight: typoTokens.fontWeightSemiBold
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.lg,
            backgroundImage: 'none'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.nav.background,
            borderTop: `1px solid ${tokens.nav.border}`
          }
        }
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: tokens.text.secondary,
            '&.Mui-selected': {
              color: tokens.nav.indicator
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.background.paper,
            backgroundImage: 'none'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.sm
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: borderRadius.lg,
            backgroundImage: 'none'
          }
        }
      }
    }
  });
}
