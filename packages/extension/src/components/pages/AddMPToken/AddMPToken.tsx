import { FC, useCallback, useState } from 'react';

import { Button, Container, Paper, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { HOME_PATH, SECONDARY_GRAY } from '../../../constants';
import { useLedger, useNetwork, useWallet } from '../../../contexts';
import { useFees } from '../../../hooks';
import { TransactionStatus } from '../../../types';
import { AsyncTransaction, PageWithTitle } from '../../templates';

export const AddMPToken: FC = () => {
  const [mptIssuanceId, setMptIssuanceId] = useState('');
  const [transaction, setTransaction] = useState<TransactionStatus>(TransactionStatus.Waiting);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { addMPTokenAuthorization } = useLedger();
  const { getCurrentWallet } = useWallet();
  const { networkName } = useNetwork();
  const navigate = useNavigate();

  // Build the transaction for fee estimation
  const mpTokenAuthorizeTx = mptIssuanceId
    ? {
        TransactionType: 'MPTokenAuthorize' as const,
        Account: getCurrentWallet()?.publicAddress || '',
        MPTokenIssuanceID: mptIssuanceId
      }
    : null;

  const { estimatedFees, errorFees } = useFees(mpTokenAuthorizeTx ?? [], undefined);

  const isValidMPTIssuanceId = useCallback((id: string): boolean => {
    // MPTokenIssuanceID is a 192-bit (48 character) hex string
    return /^[0-9A-Fa-f]{48}$/.test(id);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!mptIssuanceId || !isValidMPTIssuanceId(mptIssuanceId)) {
      setErrorMessage('Please enter a valid MPToken Issuance ID (48 hex characters)');
      return;
    }

    setTransaction(TransactionStatus.Pending);

    try {
      await addMPTokenAuthorization(mptIssuanceId);
      setTransaction(TransactionStatus.Success);
    } catch (e) {
      setErrorMessage((e as Error).message || 'Failed to authorize MPToken');
      setTransaction(TransactionStatus.Rejected);
    }
  }, [mptIssuanceId, isValidMPTIssuanceId, addMPTokenAuthorization]);

  const handleReject = useCallback(() => {
    navigate(HOME_PATH);
  }, [navigate]);

  // Show transaction status
  if (transaction === TransactionStatus.Pending) {
    return (
      <AsyncTransaction
        title="Adding MPToken..."
        subtitle="Please wait while we process your request"
        transaction={transaction}
      />
    );
  }

  if (transaction === TransactionStatus.Success) {
    return (
      <AsyncTransaction
        title="MPToken Added"
        subtitle="Your MPToken authorization has been successfully created"
        transaction={transaction}
        onClick={() => navigate(HOME_PATH)}
      />
    );
  }

  if (transaction === TransactionStatus.Rejected) {
    return (
      <AsyncTransaction
        title="Transaction Failed"
        subtitle={errorMessage || 'Failed to authorize MPToken'}
        transaction={transaction}
        onClick={() => navigate(HOME_PATH)}
      />
    );
  }

  // Show form
  return (
    <PageWithTitle title="Add MPToken">
      <div style={{ padding: '20px' }}>
        <Typography align="center" style={{ marginBottom: '20px' }}>
          Enter the MPToken Issuance ID to authorize holding this token.
        </Typography>

        <Paper elevation={3} style={{ padding: '15px', marginBottom: '20px' }}>
          <TextField
            label="MPToken Issuance ID"
            value={mptIssuanceId}
            onChange={(e) => setMptIssuanceId(e.target.value.toUpperCase())}
            fullWidth
            placeholder="48-character hex string"
            helperText={
              mptIssuanceId && !isValidMPTIssuanceId(mptIssuanceId)
                ? 'Must be a 48-character hexadecimal string'
                : ''
            }
            error={mptIssuanceId !== '' && !isValidMPTIssuanceId(mptIssuanceId)}
            inputProps={{
              style: { fontFamily: 'monospace' }
            }}
          />
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={!mptIssuanceId || !isValidMPTIssuanceId(mptIssuanceId)}
          >
            Add MPToken
          </Button>
        </Container>
      </div>
    </PageWithTitle>
  );
};
