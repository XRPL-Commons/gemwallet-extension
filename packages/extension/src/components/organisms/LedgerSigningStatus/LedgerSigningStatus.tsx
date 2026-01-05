import { FC } from 'react';
import { Box, Typography, Button, Paper, keyframes } from '@mui/material';
import Lottie from 'lottie-react';

import loadingAnimation from '../../../assets/loading.json';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export type LedgerSigningStep =
  | 'preparing'
  | 'waiting'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error';

export interface LedgerSigningStatusProps {
  step: LedgerSigningStep;
  onCancel?: () => void;
}

interface StepContent {
  title: string;
  description: string;
  instructions?: string[];
}

/**
 * Component to show Ledger device interaction status
 * Only handles device-related steps (preparing, waiting, signing)
 * Final states (submitting, success, error) should use AsyncTransaction
 */
export const LedgerSigningStatus: FC<LedgerSigningStatusProps> = ({
  step,
  onCancel
}) => {
  const getContent = (): StepContent => {
    switch (step) {
      case 'preparing':
        return {
          title: 'Preparing Transaction',
          description: 'Encoding transaction for your Ledger device...'
        };

      case 'waiting':
        return {
          title: 'Review on Device',
          description: 'Please review and approve the transaction on your Ledger',
          instructions: [
            'Check the transaction details on your device screen',
            'Use the buttons to navigate through the details',
            'Press both buttons together to approve'
          ]
        };

      case 'signing':
        return {
          title: 'Signing Transaction',
          description: 'Please sign the transaction on your Ledger device...'
        };

      default:
        return {
          title: 'Processing',
          description: 'Please wait...'
        };
    }
  };

  const content = getContent();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 3,
        px: 2,
        animation: `${fadeIn} 0.4s ease-out`
      }}
    >
      {/* Lottie Animation */}
      <Box sx={{ mb: 2 }}>
        <Lottie
          animationData={loadingAnimation}
          loop
          style={{ width: 150, height: 150 }}
        />
      </Box>

      {/* Title */}
      <Typography
        variant="h5"
        component="h1"
        align="center"
        sx={{ fontWeight: 500, mb: 1 }}
      >
        {content.title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ mb: 2 }}
      >
        {content.description}
      </Typography>

      {/* Instructions Box */}
      {content.instructions && content.instructions.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 320,
            p: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 1,
            mb: 2
          }}
        >
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            {content.instructions.map((instruction, index) => (
              <Typography
                key={index}
                variant="body2"
                component="li"
                sx={{
                  mb: index < content.instructions!.length - 1 ? 1 : 0,
                  color: 'text.secondary'
                }}
              >
                {instruction}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <Box
          sx={{
            mt: 2,
            width: '100%',
            maxWidth: 320
          }}
        >
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
};
