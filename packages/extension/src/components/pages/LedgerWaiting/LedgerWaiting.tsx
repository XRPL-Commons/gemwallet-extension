import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Typography } from '@mui/material';

import { HOME_PATH, NETWORK_BANNER_HEIGHT } from '../../../constants';
import { useNetwork } from '../../../contexts';
import { TransactionStatus } from '../../../types';
import { LedgerSigningStatus } from '../../organisms';
import { AsyncTransaction } from '../../templates';
import type { LedgerSigningStep } from '../../organisms';

interface LocationState {
  signingType: 'transaction' | 'message';
  onSuccess?: string;
  onCancel?: string;
  params?: any;
}

export const LedgerWaiting: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { networkName, hasOfflineBanner } = useNetwork();

  const [step, setStep] = useState<LedgerSigningStep>('preparing');
  const [error, setError] = useState<string>();

  const state = (location.state as LocationState) || {};
  const { onCancel } = state;

  useEffect(() => {
    setStep('preparing');

    const timer = setTimeout(() => {
      setStep('waiting');
    }, 500);

    const executePendingTransaction = async () => {
      if ((window as any).__ledgerTransactionPending) {
        try {
          await (window as any).__ledgerTransactionPending();
        } catch (e) {
          console.error('Error executing pending transaction:', e);
        }
      }
    };

    const execTimer = setTimeout(() => {
      executePendingTransaction();
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(execTimer);
    };
  }, []);

  useEffect(() => {
    const handleSigningProgress = (event: CustomEvent) => {
      const { step: newStep } = event.detail;
      setStep(newStep);
    };

    const handleSigningSuccess = () => {
      setStep('success');
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
  }, []);

  const handleCancel = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ledger:signing:cancel'));

    if (onCancel) {
      navigate(onCancel, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, onCancel]);

  const handleTransactionComplete = useCallback(() => {
    navigate(HOME_PATH);
  }, [navigate]);

  // Map step to TransactionStatus for AsyncTransaction
  const getTransactionStatus = (): TransactionStatus | null => {
    switch (step) {
      case 'submitting':
        return TransactionStatus.Pending;
      case 'success':
        return TransactionStatus.Success;
      case 'error':
        return TransactionStatus.Rejected;
      default:
        return null;
    }
  };

  const transactionStatus = getTransactionStatus();

  // Use AsyncTransaction for final states (submitting, success, error)
  if (transactionStatus !== null) {
    const getTitle = () => {
      switch (step) {
        case 'submitting':
          return 'Transaction in progress';
        case 'success':
          return 'Transaction accepted';
        case 'error':
          return 'Transaction rejected';
        default:
          return '';
      }
    };

    const getSubtitle = () => {
      switch (step) {
        case 'submitting':
          return (
            <>
              We are processing your transaction
              <br />
              Please wait
            </>
          );
        case 'success':
          return 'Transaction Successful';
        case 'error':
          return (
            <>
              Your transaction failed, please try again.
              <br />
              {error || ''}
            </>
          );
        default:
          return '';
      }
    };

    return (
      <AsyncTransaction
        title={getTitle()}
        subtitle={getSubtitle()}
        transaction={transactionStatus}
        onClick={handleTransactionComplete}
      />
    );
  }

  // Use LedgerSigningStatus for device interaction steps (preparing, waiting, signing)
  return (
    <Container
      component='main'
      style={{
        ...(hasOfflineBanner ? { position: 'fixed', top: NETWORK_BANNER_HEIGHT } : {}),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: hasOfflineBanner ? `calc(100vh - ${NETWORK_BANNER_HEIGHT}px)` : '100vh',
        padding: '20px 16px',
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <LedgerSigningStatus step={step} onCancel={handleCancel} />
      </div>

      <Typography variant='caption' color='text.secondary' style={{ marginBottom: '10px' }}>
        Network: {networkName}
      </Typography>
    </Container>
  );
};
