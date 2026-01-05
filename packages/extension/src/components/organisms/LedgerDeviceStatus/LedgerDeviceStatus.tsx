import { FC } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import UsbIcon from '@mui/icons-material/Usb';
import { LedgerConnectionSignal, type ConnectionStatus } from '../../atoms';
import { LedgerDeviceState, LEDGER_STATE_MESSAGES } from '../../../utils/ledger';

export interface LedgerDeviceStatusProps {
  state: LedgerDeviceState | null;
  customMessage?: string;
  onConnect?: () => void;
}

/**
 * Component to display Ledger device status with connection signal
 * Redesigned as a clean status bar with visual indicators
 */
export const LedgerDeviceStatus: FC<LedgerDeviceStatusProps> = ({
  state,
  customMessage,
  onConnect
}) => {
  if (!state) return null;

  const getConnectionStatus = (): ConnectionStatus => {
    switch (state) {
      case LedgerDeviceState.READY:
        return 'connected';
      case LedgerDeviceState.LOCKED:
      case LedgerDeviceState.APP_NOT_OPEN:
        return 'warning';
      case LedgerDeviceState.NOT_CONNECTED:
      case LedgerDeviceState.UNKNOWN:
      default:
        return 'disconnected';
    }
  };

  const getInstructions = (): string[] => {
    switch (state) {
      case LedgerDeviceState.NOT_CONNECTED:
        return [
          'Connect your Ledger device via USB',
          'Make sure the cable is properly connected',
          'Try a different USB port if needed'
        ];
      case LedgerDeviceState.LOCKED:
        return [
          'Unlock your Ledger device',
          'Enter your PIN on the device'
        ];
      case LedgerDeviceState.APP_NOT_OPEN:
        return [
          'Open the XRP application on your Ledger',
          'Navigate using the device buttons'
        ];
      case LedgerDeviceState.READY:
        return [];
      default:
        return [];
    }
  };

  const message = customMessage || LEDGER_STATE_MESSAGES[state];
  const instructions = getInstructions();
  const connectionStatus = getConnectionStatus();
  const isReady = state === LedgerDeviceState.READY;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Header Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LedgerConnectionSignal
            status={connectionStatus}
            size="medium"
            showPulse={isReady}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UsbIcon
              sx={{
                fontSize: 20,
                color: isReady ? 'success.main' : 'text.secondary'
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: isReady ? 'success.main' : 'text.primary'
              }}
            >
              {isReady ? 'Ledger Connected' : 'Ledger'}
            </Typography>
          </Box>
        </Box>

        {onConnect && !isReady && (
          <Button
            size="small"
            variant="text"
            onClick={onConnect}
          >
            Connect
          </Button>
        )}
      </Box>

      {/* Status Message */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, ml: 3.5 }}
      >
        {message}
      </Typography>

      {/* Instructions */}
      {instructions.length > 0 && (
        <Box
          component="ol"
          sx={{
            mt: 1.5,
            mb: 0,
            ml: 3.5,
            pl: 2
          }}
        >
          {instructions.map((instruction, index) => (
            <Typography
              key={index}
              variant="body2"
              component="li"
              sx={{
                color: 'text.secondary',
                mb: index < instructions.length - 1 ? 0.5 : 0
              }}
            >
              {instruction}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
};
