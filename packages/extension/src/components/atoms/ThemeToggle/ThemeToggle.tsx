import { FC } from 'react';

import { Box, Switch, Typography } from '@mui/material';

import { useThemeMode } from '../../../contexts';

export const ThemeToggle: FC = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        py: 1
      }}
    >
      <Typography variant="body1">Dark Mode</Typography>
      <Switch checked={mode === 'dark'} onChange={toggleTheme} />
    </Box>
  );
};
