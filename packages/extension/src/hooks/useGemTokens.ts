import { useTheme } from '@mui/material/styles';

import { SemanticTokens } from '../constants/designTokens';

export const useGemTokens = (): SemanticTokens => {
  const theme = useTheme();
  return theme.gemTokens;
};
