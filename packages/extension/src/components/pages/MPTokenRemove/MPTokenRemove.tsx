import { FC, useCallback, useEffect, useState } from 'react';

import { Button, Container, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { HOME_PATH, SECONDARY_GRAY, STORAGE_MESSAGING_KEY } from '../../../constants';
import { useLedger, useNetwork, useWallet } from '../../../contexts';
import { useFees, useFetchFromSessionStorage } from '../../../hooks';
import { TransactionStatus } from '../../../types';
import { MPTokenAuthorizeFlags } from '../../../types/mptoken.types';
import { truncateMPTIssuanceId } from '../../../utils/fetchMPTokenData';
import { AsyncTransaction, PageWithTitle } from '../../templates';

interface MPTokenRemoveParams {
  mptIssuanceId: string;
  tokenName: string;
  issuer: string;
  issuerName?: string;
}

export const MPTokenRemove: FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inAppCall = urlParams.get('inAppCall') === 'true' || false;

  const [params, setParams] = useState<MPTokenRemoveParams | null>(null);
  const [transaction, setTransaction] = useState<TransactionStatus>(TransactionStatus.Waiting);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { removeMPTokenAuthorization } = useLedger();
  const { getCurrentWallet } = useWallet();
  const { networkName } = useNetwork();
  const navigate = useNavigate();

  const { fetchedData } = useFetchFromSessionStorage(
    urlParams.get(STORAGE_MESSAGING_KEY) ?? undefined
  ) as {
    fetchedData: MPTokenRemoveParams | undefined;
  };

  // Build the transaction for fee estimation
  const mpTokenAuthorizeTx = params
    ? {
        TransactionType: 'MPTokenAuthorize' as const,
        Account: getCurrentWallet()?.publicAddress || '',
        MPTokenIssuanceID: params.mptIssuanceId,
        Flags: MPTokenAuthorizeFlags.tfMPTUnauthorize
      }
    : null;

  const { estimatedFees, errorFees } = useFees(mpTokenAuthorizeTx ?? [], undefined);

  useEffect(() => {
    if (fetchedData) {
      setParams(fetchedData);
    }
  }, [fetchedData]);

  const handleConfirm = useCallback(async () => {
    if (!params) return;

    setTransaction(TransactionStatus.Pending);

    try {
      await removeMPTokenAuthorization(params.mptIssuanceId);
      setTransaction(TransactionStatus.Success);
    } catch (e) {
      setErrorMessage((e as Error).message || 'Failed to remove MPToken authorization');
      setTransaction(TransactionStatus.Rejected);
    }
  }, [params, removeMPTokenAuthorization]);

  const handleReject = useCallback(() => {
    navigate(HOME_PATH);
  }, [navigate]);

  // Show loading state while fetching params
  if (!params) {
    return (
      <PageWithTitle title="Remove MPToken">
        <Typography align="center" style={{ marginTop: '20px' }}>
          Loading...
        </Typography>
      </PageWithTitle>
    );
  }

  // Show transaction status
  if (transaction === TransactionStatus.Pending) {
    return (
      <AsyncTransaction
        title="Removing MPToken..."
        subtitle="Please wait while we process your request"
        transaction={transaction}
      />
    );
  }

  if (transaction === TransactionStatus.Success) {
    return (
      <AsyncTransaction
        title="MPToken Removed"
        subtitle="Your MPToken authorization has been successfully removed"
        transaction={transaction}
        onClick={inAppCall ? () => navigate(HOME_PATH) : undefined}
      />
    );
  }

  if (transaction === TransactionStatus.Rejected) {
    return (
      <AsyncTransaction
        title="Transaction Failed"
        subtitle={errorMessage || 'Failed to remove MPToken authorization'}
        transaction={transaction}
        onClick={inAppCall ? () => navigate(HOME_PATH) : undefined}
      />
    );
  }

  // Show confirmation screen
  return (
    <PageWithTitle title="Remove MPToken">
      <div style={{ padding: '20px' }}>
        <Typography align="center" style={{ marginBottom: '20px' }}>
          Are you sure you want to remove this MPToken authorization?
        </Typography>

        <Paper elevation={3} style={{ padding: '15px', marginBottom: '20px' }}>
          <Typography variant="subtitle2" style={{ color: SECONDARY_GRAY, marginBottom: '5px' }}>
            Token
          </Typography>
          <Typography variant="body1" style={{ marginBottom: '15px' }}>
            {params.tokenName}
          </Typography>

          <Typography variant="subtitle2" style={{ color: SECONDARY_GRAY, marginBottom: '5px' }}>
            Issuance ID
          </Typography>
          <Typography
            variant="body2"
            style={{ marginBottom: '15px', wordBreak: 'break-all', fontFamily: 'monospace' }}
          >
            {truncateMPTIssuanceId(params.mptIssuanceId, 12, 12)}
          </Typography>

          {params.issuerName && (
            <>
              <Typography
                variant="subtitle2"
                style={{ color: SECONDARY_GRAY, marginBottom: '5px' }}
              >
                Issuer
              </Typography>
              <Typography variant="body1" style={{ marginBottom: '15px' }}>
                {params.issuerName}
              </Typography>
            </>
          )}

          <Typography variant="subtitle2" style={{ color: SECONDARY_GRAY, marginBottom: '5px' }}>
            Issuer Address
          </Typography>
          <Typography variant="body2" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {params.issuer}
          </Typography>
        </Paper>

        <Paper elevation={3} style={{ padding: '15px', marginBottom: '20px' }}>
          <Typography variant="subtitle2" style={{ color: SECONDARY_GRAY, marginBottom: '5px' }}>
            Network
          </Typography>
          <Typography variant="body1" style={{ marginBottom: '15px' }}>
            {networkName}
          </Typography>

          <Typography variant="subtitle2" style={{ color: SECONDARY_GRAY, marginBottom: '5px' }}>
            Estimated Fee
          </Typography>
          <Typography variant="body1">
            {errorFees ? 'Error estimating fee' : `${estimatedFees} XRP`}
          </Typography>
        </Paper>

        <Container style={{ display: 'flex', justifyContent: 'space-evenly', marginTop: '20px' }}>
          <Button variant="contained" color="secondary" onClick={handleReject}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleConfirm}>
            Remove
          </Button>
        </Container>
      </div>
    </PageWithTitle>
  );
};
