import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { STORAGE_THEME_MODE } from '../../constants/storage';
import { createGemTheme } from '../../theme';
import {
  loadFromChromeLocalStorage,
  saveInChromeLocalStorage
} from '../../utils/storageChromeLocal';

type ThemeMode = 'light' | 'dark';

interface ContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

interface Props {
  children: React.ReactElement;
}

const ThemeModeContext = createContext<ContextType>({
  mode: 'dark',
  toggleTheme: () => {},
  setMode: () => {}
});

const persistMode = (mode: ThemeMode) => {
  // Chrome local storage for production
  saveInChromeLocalStorage(STORAGE_THEME_MODE, mode);
  // localStorage fallback for dev (chrome storage is no-op in dev)
  try {
    localStorage.setItem(STORAGE_THEME_MODE, mode);
  } catch {
    // Ignore if localStorage is unavailable
  }
};

const loadPersistedMode = async (): Promise<ThemeMode | null> => {
  // Try chrome storage first (production)
  const chromeValue = await loadFromChromeLocalStorage(STORAGE_THEME_MODE);
  if (chromeValue === 'light' || chromeValue === 'dark') {
    return chromeValue;
  }
  // Fallback to localStorage (dev)
  try {
    const localValue = localStorage.getItem(STORAGE_THEME_MODE);
    if (localValue === 'light' || localValue === 'dark') {
      return localValue;
    }
  } catch {
    // Ignore
  }
  return null;
};

const ThemeModeProvider: FC<Props> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadPersistedMode().then((persisted) => {
      if (persisted) {
        setModeState(persisted);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    persistMode(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persistMode(next);
      return next;
    });
  }, []);

  const theme = useMemo(() => createGemTheme(mode), [mode]);

  const value: ContextType = useMemo(
    () => ({ mode, toggleTheme, setMode }),
    [mode, toggleTheme, setMode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

const useThemeMode = (): ContextType => {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

export { ThemeModeProvider, ThemeModeContext, useThemeMode };
