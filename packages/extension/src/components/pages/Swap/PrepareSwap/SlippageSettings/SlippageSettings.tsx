import { FC, useCallback, useState } from 'react';

import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  ButtonGroup,
  Collapse,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import {
  HIGH_SLIPPAGE_WARNING_THRESHOLD,
  MAX_SLIPPAGE,
  SLIPPAGE_OPTIONS
} from '../../../../../constants';

export interface SlippageSettingsProps {
  slippage: number;
  onSlippageChange: (slippage: number) => void;
}

export const SlippageSettings: FC<SlippageSettingsProps> = ({ slippage, onSlippageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handlePresetClick = useCallback(
    (value: number) => {
      setIsCustom(false);
      setCustomSlippage('');
      onSlippageChange(value);
    },
    [onSlippageChange]
  );

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Only allow valid decimal numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setCustomSlippage(value);
        setIsCustom(true);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= MAX_SLIPPAGE * 100) {
          onSlippageChange(numValue / 100);
        }
      }
    },
    [onSlippageChange]
  );

  const formatSlippageLabel = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const isHighSlippage = slippage > HIGH_SLIPPAGE_WARNING_THRESHOLD;
  const isPresetSelected = (value: number) => !isCustom && Math.abs(slippage - value) < 0.0001;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          p: 1,
          borderRadius: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)'
          }
        }}
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Slippage Tolerance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isHighSlippage && (
            <Tooltip title="High slippage may result in unfavorable rates">
              <WarningIcon fontSize="small" color="warning" />
            </Tooltip>
          )}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: isHighSlippage ? 'warning.main' : 'text.primary'
            }}
          >
            {formatSlippageLabel(slippage)}
          </Typography>
        </Box>
      </Box>

      <Collapse in={isOpen}>
        <Box sx={{ mt: 1, p: 1 }}>
          <ButtonGroup size="small" fullWidth sx={{ mb: 1 }}>
            {SLIPPAGE_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={isPresetSelected(option) ? 'contained' : 'outlined'}
                onClick={() => handlePresetClick(option)}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5
                }}
              >
                {formatSlippageLabel(option)}
              </Button>
            ))}
          </ButtonGroup>

          <TextField
            size="small"
            fullWidth
            placeholder="Custom"
            value={customSlippage}
            onChange={handleCustomChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: isCustom ? 'rgba(156, 39, 176, 0.1)' : 'transparent'
              }
            }}
            autoComplete="off"
          />

          {isHighSlippage && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Your transaction may be frontrun due to high slippage tolerance
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
