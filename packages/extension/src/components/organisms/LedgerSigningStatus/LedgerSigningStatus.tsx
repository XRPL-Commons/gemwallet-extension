import { FC } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export type LedgerSigningStep =
  | 'preparing'      // Preparing transaction
  | 'waiting'        // Waiting for user to sign on device
  | 'signing'        // Device is signing
  | 'submitting'     // Submitting to network
  | 'success'        // Transaction successful
  | 'error';         // Error occurred

export interface LedgerSigningStatusProps {
  step: LedgerSigningStep;
  error?: string;
  txHash?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}

/**
 * Component to show transaction signing status with Ledger device
 */
export const LedgerSigningStatus: FC<LedgerSigningStatusProps> = ({
  step,
  error,
  txHash,
  onCancel,
  onRetry
}) => {
  const getContent = () => {
    switch (step) {
      case 'preparing':
        return {
          icon: <CircularProgress size={60} />,
          title: 'Preparing Transaction',
          description: 'Encoding transaction for your Ledger device...',
          severity: 'info' as const
        };

      case 'waiting':
        return {
          icon: <CircularProgress size={60} />,
          title: 'Review on Device',
          description: 'Please review and approve the transaction on your Ledger device',
          instructions: [
            'Check the transaction details on your device screen',
            'Use the buttons to navigate through the details',
            'Press both buttons together to approve',
            'Or press the right button to reject'
          ],
          severity: 'warning' as const
        };

      case 'signing':
        return {
          icon: <CircularProgress size={60} />,
          title: 'Signing Transaction',
          description: 'Your Ledger is signing the transaction...',
          severity: 'info' as const
        };

      case 'submitting':
        return {
          icon: <CircularProgress size={60} />,
          title: 'Submitting to Network',
          description: 'Broadcasting your transaction to the XRP Ledger...',
          severity: 'info' as const
        };

      case 'success':
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          title: 'Transaction Successful',
          description: txHash ? `Transaction Hash: ${txHash.substring(0, 16)}...` : 'Your transaction has been confirmed on the ledger',
          severity: 'success' as const
        };

      case 'error':
        return {
          icon: <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />,
          title: 'Transaction Failed',
          description: error || 'An error occurred while processing your transaction',
          severity: 'error' as const
        };

      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        px: 2
      }}
    >
      <Box sx={{ mb: 3 }}>{content.icon}</Box>

      <Typography variant="h6" gutterBottom align="center">
        {content.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        {content.description}
      </Typography>

      {content.instructions && (
        <Alert severity={content.severity} sx={{ width: '100%', mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Instructions:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            {content.instructions.map((instruction, index) => (
              <Typography key={index} variant="body2" component="li" sx={{ mb: 0.5 }}>
                {instruction}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {step === 'error' && error && (
        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Action Buttons */}
      {(onCancel || onRetry) && (
        <Box sx={{ display: 'flex', gap: 2, mt: 3, width: '100%', justifyContent: 'center' }}>
          {onCancel && step !== 'success' && (
            <Button variant="outlined" onClick={onCancel} sx={{ minWidth: 120 }}>
              Cancel
            </Button>
          )}
          {onRetry && step === 'error' && (
            <Button variant="contained" onClick={onRetry} sx={{ minWidth: 120 }}>
              Retry
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};
