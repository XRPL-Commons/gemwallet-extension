import { FC } from 'react';
import { Alert, Box, Typography, CircularProgress } from '@mui/material';
import { LedgerDeviceState, LEDGER_STATE_MESSAGES } from '../../../utils/ledger';

export interface LedgerDeviceStatusProps {
  state: LedgerDeviceState | null;
  customMessage?: string;
  showSpinner?: boolean;
}

/**
 * Component to display Ledger device status with helpful instructions
 */
export const LedgerDeviceStatus: FC<LedgerDeviceStatusProps> = ({
  state,
  customMessage,
  showSpinner = false
}) => {
  if (!state) return null;

  const getSeverity = (): 'error' | 'warning' | 'info' | 'success' => {
    switch (state) {
      case LedgerDeviceState.READY:
        return 'success';
      case LedgerDeviceState.LOCKED:
      case LedgerDeviceState.APP_NOT_OPEN:
        return 'warning';
      case LedgerDeviceState.NOT_CONNECTED:
      case LedgerDeviceState.UNKNOWN:
        return 'error';
      default:
        return 'info';
    }
  };

  const getInstructions = (): string[] => {
    switch (state) {
      case LedgerDeviceState.NOT_CONNECTED:
        return [
          'Connect your Ledger device via USB',
          'Make sure the cable is properly connected',
          'Try a different USB port if the issue persists'
        ];
      case LedgerDeviceState.LOCKED:
        return [
          'Unlock your Ledger device',
          'Enter your PIN on the device',
          'Wait for the device to be ready'
        ];
      case LedgerDeviceState.APP_NOT_OPEN:
        return [
          'Open the XRP application on your Ledger',
          'Navigate using the buttons on your device',
          'Press both buttons to open the app'
        ];
      case LedgerDeviceState.READY:
        return ['Your Ledger device is ready'];
      default:
        return [];
    }
  };

  const message = customMessage || LEDGER_STATE_MESSAGES[state];
  const instructions = getInstructions();

  return (
    <Alert severity={getSeverity()} sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showSpinner && <CircularProgress size={20} />}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {message}
          </Typography>
          {instructions.length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {instructions.map((instruction, index) => (
                <Typography key={index} variant="body2" component="li" sx={{ mb: 0.5 }}>
                  {instruction}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Alert>
  );
};
