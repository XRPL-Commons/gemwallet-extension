import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import { useNetwork } from '../../../contexts';
import { LedgerSigningStatus } from '../../organisms';
import type { LedgerSigningStep } from '../../organisms';

interface LocationState {
  // Common params
  signingType: 'transaction' | 'message';
  onSuccess?: string; // Route to navigate to on success
  onCancel?: string; // Route to navigate to on cancel

  // Additional params for context
  params?: any;
}

export const LedgerWaiting: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { networkName } = useNetwork();

  const [step, setStep] = useState<LedgerSigningStep>('preparing');
  const [error, setError] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  const state = (location.state as LocationState) || {};
  const { onSuccess, onCancel } = state;

  useEffect(() => {
    // Start with preparing step
    setStep('preparing');

    // Move to waiting step after a brief moment
    const timer = setTimeout(() => {
      setStep('waiting');
    }, 500);

    // Check if there's a pending transaction to execute
    const executePendingTransaction = async () => {
      if ((window as any).__ledgerTransactionPending) {
        try {
          await (window as any).__ledgerTransactionPending();
        } catch (e) {
          // Error will be handled by the event listeners
          console.error('Error executing pending transaction:', e);
        }
      }
    };

    // Execute after a short delay to allow UI to render
    const execTimer = setTimeout(() => {
      executePendingTransaction();
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(execTimer);
    };
  }, []);

  // Listen for ledger signing events
  useEffect(() => {
    const handleSigningProgress = (event: CustomEvent) => {
      const { step: newStep } = event.detail;
      setStep(newStep);
    };

    const handleSigningSuccess = (event: CustomEvent) => {
      const { hash } = event.detail;

      if (hash) {
        setTxHash(hash);
      }

      setStep('success');

      // Auto-navigate after success delay
      setTimeout(() => {
        if (onSuccess) {
          navigate(onSuccess, { replace: true });
        } else {
          navigate(-1); // Go back to previous page
        }
      }, 2000);
    };

    const handleSigningError = (event: CustomEvent) => {
      const { error: errorMessage } = event.detail;
      setStep('error');
      setError(errorMessage);
    };

    window.addEventListener('ledger:signing:progress' as any, handleSigningProgress);
    window.addEventListener('ledger:signing:success' as any, handleSigningSuccess);
    window.addEventListener('ledger:signing:error' as any, handleSigningError);

    return () => {
      window.removeEventListener('ledger:signing:progress' as any, handleSigningProgress);
      window.removeEventListener('ledger:signing:success' as any, handleSigningSuccess);
      window.removeEventListener('ledger:signing:error' as any, handleSigningError);
    };
  }, [navigate, onSuccess]);

  const handleCancel = useCallback(() => {
    // Emit cancel event
    window.dispatchEvent(new CustomEvent('ledger:signing:cancel'));

    if (onCancel) {
      navigate(onCancel, { replace: true });
    } else {
      navigate(-1); // Go back
    }
  }, [navigate, onCancel]);

  const handleRetry = useCallback(() => {
    // Reset to waiting state
    setStep('waiting');
    setError(undefined);

    // Emit retry event
    window.dispatchEvent(new CustomEvent('ledger:signing:retry'));
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ maxWidth: 500, width: '100%' }}>
        <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
          Ledger Signing
        </Typography>

        <LedgerSigningStatus
          step={step}
          error={error}
          txHash={txHash}
          onCancel={step !== 'success' ? handleCancel : undefined}
          onRetry={step === 'error' ? handleRetry : undefined}
        />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 3, display: 'block', textAlign: 'center' }}
        >
          Network: {networkName}
        </Typography>
      </Box>
    </Box>
  );
};
