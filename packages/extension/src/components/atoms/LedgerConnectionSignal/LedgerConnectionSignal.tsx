import { FC } from 'react';
import { Box, keyframes } from '@mui/material';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

export type ConnectionStatus = 'connected' | 'disconnected' | 'warning';

export interface LedgerConnectionSignalProps {
  status: ConnectionStatus;
  size?: 'small' | 'medium';
  showPulse?: boolean;
}

/**
 * A small colored dot indicator for Ledger connection status
 * - Green: Connected and ready
 * - Orange: Warning (locked or app not open)
 * - Gray: Disconnected
 */
export const LedgerConnectionSignal: FC<LedgerConnectionSignalProps> = ({
  status,
  size = 'medium',
  showPulse = true
}) => {
  const dotSize = size === 'small' ? '6px' : '8px';

  const getColor = () => {
    switch (status) {
      case 'connected':
        return '#4CAF50'; // Green
      case 'warning':
        return '#FF9800'; // Orange
      case 'disconnected':
      default:
        return '#9E9E9E'; // Gray
    }
  };

  return (
    <Box
      sx={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: getColor(),
        flexShrink: 0,
        ...(status === 'connected' && showPulse
          ? {
              animation: `${pulse} 2s ease-in-out infinite`
            }
          : {})
      }}
    />
  );
};
