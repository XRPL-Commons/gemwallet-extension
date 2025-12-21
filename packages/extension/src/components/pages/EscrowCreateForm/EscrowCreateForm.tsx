import { FC, FocusEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Button, CircularProgress, Snackbar, TextField, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import { isValidAddress } from 'xrpl';

import {
  DEFAULT_RESERVE,
  ESCROW_PATH,
  RESERVE_PER_OWNER,
  SECONDARY_GRAY
} from '../../../constants';
import { buildEscrowCreate, useLedger, useNetwork, useServer, useWallet } from '../../../contexts';
import { dateToRippleTime } from '../../../utils/fetchEscrowData';
import { NumericInput } from '../../atoms';
import { InformationMessage } from '../../molecules';
import { PageWithReturn } from '../../templates';

const BOTTOM_SPACING = '20px';

// Minimum date is 1 minute from now
const getMinDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 1);
  return date.toISOString().slice(0, 16);
};

export const EscrowCreateForm: FC = () => {
  const navigate = useNavigate();
  const { getCurrentWallet } = useWallet();
  const { client } = useNetwork();
  const { serverInfo } = useServer();
  const { escrowCreate, getAccountInfo } = useLedger();

  // Form state
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [finishAfter, setFinishAfter] = useState('');
  const [cancelAfter, setCancelAfter] = useState('');

  // Error state
  const [errorDestination, setErrorDestination] = useState('');
  const [errorAmount, setErrorAmount] = useState('');
  const [errorFinishAfter, setErrorFinishAfter] = useState('');
  const [errorCancelAfter, setErrorCancelAfter] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletActivated, setIsWalletActivated] = useState(true);
  const [ownerCount, setOwnerCount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const baseReserve = useMemo(
    () => serverInfo?.info.validated_ledger?.reserve_base_xrp || DEFAULT_RESERVE,
    [serverInfo?.info.validated_ledger?.reserve_base_xrp]
  );

  const reserve = useMemo(() => {
    return ownerCount * RESERVE_PER_OWNER + baseReserve;
  }, [baseReserve, ownerCount]);

  const availableBalance = useMemo(() => {
    return Math.max(0, balance - reserve);
  }, [balance, reserve]);

  // Check wallet activation and fetch balance
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const wallet = getCurrentWallet();
        if (wallet && client) {
          const xrpBalance = await client.getXrpBalance(wallet.publicAddress);
          setBalance(Number(xrpBalance));
          setIsWalletActivated(true);

          const accountInfo = await getAccountInfo();
          setOwnerCount(accountInfo.result.account_data.OwnerCount);
        } else {
          setIsWalletActivated(false);
        }
      } catch (e) {
        setIsWalletActivated(false);
      }
    };
    checkWallet();
  }, [client, getCurrentWallet, getAccountInfo]);

  const isFormValid = useMemo(() => {
    return (
      destination !== '' &&
      isValidAddress(destination) &&
      amount !== '' &&
      Number(amount) > 0 &&
      (finishAfter !== '' || cancelAfter !== '') &&
      errorDestination === '' &&
      errorAmount === '' &&
      errorFinishAfter === '' &&
      errorCancelAfter === ''
    );
  }, [
    destination,
    amount,
    finishAfter,
    cancelAfter,
    errorDestination,
    errorAmount,
    errorFinishAfter,
    errorCancelAfter
  ]);

  const handleDestinationChange = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    setErrorDestination('');
  }, []);

  const handleDestinationBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const wallet = getCurrentWallet();
      if (e.target.value === wallet?.publicAddress) {
        setErrorDestination('You cannot create an escrow to yourself');
      } else if (e.target.value !== '' && !isValidAddress(e.target.value)) {
        setErrorDestination('Invalid destination address');
      }
    },
    [getCurrentWallet]
  );

  const handleAmountChange = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAmount(value);

      if (value === '' || Number(value) <= 0) {
        setErrorAmount('Amount must be greater than zero');
      } else if (Number(value) > availableBalance) {
        setErrorAmount(`Insufficient funds. Available: ${availableBalance.toFixed(2)} XRP`);
      } else {
        setErrorAmount('');
      }
    },
    [availableBalance]
  );

  const handleFinishAfterChange = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFinishAfter(value);
      setErrorFinishAfter('');

      if (value && cancelAfter) {
        const finishDate = new Date(value);
        const cancelDate = new Date(cancelAfter);
        if (finishDate >= cancelDate) {
          setErrorFinishAfter('Finish time must be before cancel time');
        }
      }
    },
    [cancelAfter]
  );

  const handleCancelAfterChange = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCancelAfter(value);
      setErrorCancelAfter('');

      if (value && finishAfter) {
        const finishDate = new Date(finishAfter);
        const cancelDate = new Date(value);
        if (finishDate >= cancelDate) {
          setErrorCancelAfter('Cancel time must be after finish time');
        }
      }
    },
    [finishAfter]
  );

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    const wallet = getCurrentWallet();
    if (!wallet) {
      setErrorMessage('Wallet not found');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Convert amount to drops
      const amountDrops = String(Math.floor(Number(amount) * 1_000_000));

      // Build the escrow create transaction
      const transaction = buildEscrowCreate(
        {
          amount: amountDrops,
          destination,
          ...(finishAfter && { finishAfter: dateToRippleTime(new Date(finishAfter)) }),
          ...(cancelAfter && { cancelAfter: dateToRippleTime(new Date(cancelAfter)) })
        },
        wallet
      );

      const result = await escrowCreate(transaction);

      if (result.hash) {
        setSuccessMessage('Escrow created successfully!');
        // Navigate back to escrow list after short delay
        setTimeout(() => {
          navigate(ESCROW_PATH);
        }, 1500);
      }
    } catch (e) {
      Sentry.captureException(e);
      setErrorMessage((e as Error).message || 'Failed to create escrow');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    getCurrentWallet,
    amount,
    destination,
    finishAfter,
    cancelAfter,
    escrowCreate,
    navigate
  ]);

  if (!isWalletActivated) {
    return (
      <PageWithReturn title="Create Escrow" onBackClick={() => navigate(-1)}>
        <InformationMessage title="Wallet not activated">
          <Typography>You cannot create an escrow because your wallet is not activated.</Typography>
        </InformationMessage>
      </PageWithReturn>
    );
  }

  return (
    <PageWithReturn
      title="Create Escrow"
      onBackClick={() => navigate(-1)}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <Typography variant="body2" style={{ color: SECONDARY_GRAY, marginBottom: '20px' }}>
          Create an escrow to lock XRP that can be released after a specific time.
        </Typography>

        <TextField
          label="Destination Address"
          fullWidth
          value={destination}
          error={!!errorDestination}
          helperText={errorDestination}
          onChange={handleDestinationChange}
          onBlur={handleDestinationBlur}
          style={{ marginBottom: errorDestination ? '10px' : BOTTOM_SPACING }}
          autoComplete="off"
        />

        <NumericInput
          label="Amount (XRP)"
          fullWidth
          error={!!errorAmount}
          helperText={errorAmount || `Available: ${availableBalance.toFixed(2)} XRP`}
          onChange={handleAmountChange}
          style={{ marginBottom: BOTTOM_SPACING }}
          autoComplete="off"
        />

        <Typography
          variant="caption"
          style={{ color: SECONDARY_GRAY, display: 'block', marginBottom: '10px' }}
        >
          At least one of the following times must be set:
        </Typography>

        <TextField
          label="Finish After (optional)"
          type="datetime-local"
          fullWidth
          value={finishAfter}
          error={!!errorFinishAfter}
          helperText={errorFinishAfter || 'Earliest time the escrow can be finished'}
          onChange={handleFinishAfterChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: getMinDateTime() }}
          style={{ marginBottom: BOTTOM_SPACING }}
        />

        <TextField
          label="Cancel After (optional)"
          type="datetime-local"
          fullWidth
          value={cancelAfter}
          error={!!errorCancelAfter}
          helperText={errorCancelAfter || 'Time after which the escrow can be cancelled'}
          onChange={handleCancelAfterChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: getMinDateTime() }}
          style={{ marginBottom: BOTTOM_SPACING }}
        />
      </div>

      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        style={{ marginTop: '20px' }}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Escrow'}
      </Button>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={5000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </PageWithReturn>
  );
};
