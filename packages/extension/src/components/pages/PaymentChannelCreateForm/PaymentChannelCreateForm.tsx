import { FC, FocusEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Button, CircularProgress, Snackbar, TextField, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import { isValidAddress } from 'xrpl';

import {
  DEFAULT_RESERVE,
  PAYMENT_CHANNELS_PATH,
  RESERVE_PER_OWNER,
  SECONDARY_GRAY
} from '../../../constants';
import {
  buildPaymentChannelCreate,
  useLedger,
  useNetwork,
  useServer,
  useWallet
} from '../../../contexts';
import { NumericInput } from '../../atoms';
import { InformationMessage } from '../../molecules';
import { PageWithReturn } from '../../templates';

const BOTTOM_SPACING = '20px';

// Default settle delay: 1 hour (in seconds)
const DEFAULT_SETTLE_DELAY = 3600;

// Convert JavaScript Date to Ripple time (seconds since Jan 1, 2000)
const dateToRippleTime = (date: Date): number => {
  const RIPPLE_EPOCH = 946684800;
  return Math.floor(date.getTime() / 1000) - RIPPLE_EPOCH;
};

// Minimum cancel after date is 1 hour from now
const getMinDateTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
};

export const PaymentChannelCreateForm: FC = () => {
  const navigate = useNavigate();
  const { getCurrentWallet } = useWallet();
  const { client } = useNetwork();
  const { serverInfo } = useServer();
  const { paymentChannelCreate, getAccountInfo } = useLedger();

  // Form state
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [settleDelay, setSettleDelay] = useState(String(DEFAULT_SETTLE_DELAY));
  const [cancelAfter, setCancelAfter] = useState('');

  // Error state
  const [errorDestination, setErrorDestination] = useState('');
  const [errorAmount, setErrorAmount] = useState('');
  const [errorSettleDelay, setErrorSettleDelay] = useState('');
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
      settleDelay !== '' &&
      Number(settleDelay) > 0 &&
      errorDestination === '' &&
      errorAmount === '' &&
      errorSettleDelay === '' &&
      errorCancelAfter === ''
    );
  }, [
    destination,
    amount,
    settleDelay,
    errorDestination,
    errorAmount,
    errorSettleDelay,
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
        setErrorDestination('You cannot create a payment channel to yourself');
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

  const handleSettleDelayChange = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSettleDelay(value);

    if (value === '' || Number(value) <= 0) {
      setErrorSettleDelay('Settle delay must be greater than zero');
    } else if (!Number.isInteger(Number(value))) {
      setErrorSettleDelay('Settle delay must be a whole number');
    } else {
      setErrorSettleDelay('');
    }
  }, []);

  const handleCancelAfterChange = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCancelAfter(value);
    setErrorCancelAfter('');

    if (value) {
      const cancelDate = new Date(value);
      const now = new Date();
      if (cancelDate <= now) {
        setErrorCancelAfter('Cancel time must be in the future');
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    const wallet = getCurrentWallet();
    if (!wallet) {
      setErrorMessage('Wallet not found');
      return;
    }

    // Get the public key from the wallet
    const publicKey = wallet.wallet.publicKey;
    if (!publicKey) {
      setErrorMessage('Cannot retrieve public key from wallet');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Convert amount to drops
      const amountDrops = String(Math.floor(Number(amount) * 1_000_000));

      // Build the payment channel create transaction
      const transaction = buildPaymentChannelCreate(
        {
          destination,
          amount: amountDrops,
          settleDelay: Number(settleDelay),
          publicKey,
          ...(cancelAfter && { cancelAfter: dateToRippleTime(new Date(cancelAfter)) })
        },
        wallet
      );

      const result = await paymentChannelCreate(transaction);

      if (result.hash) {
        setSuccessMessage('Payment channel created successfully!');
        // Navigate back to payment channels list after short delay
        setTimeout(() => {
          navigate(PAYMENT_CHANNELS_PATH);
        }, 1500);
      }
    } catch (e) {
      Sentry.captureException(e);
      setErrorMessage((e as Error).message || 'Failed to create payment channel');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    getCurrentWallet,
    amount,
    destination,
    settleDelay,
    cancelAfter,
    paymentChannelCreate,
    navigate
  ]);

  if (!isWalletActivated) {
    return (
      <PageWithReturn title="Create Payment Channel" onBackClick={() => navigate(-1)}>
        <InformationMessage title="Wallet not activated">
          <Typography>
            You cannot create a payment channel because your wallet is not activated.
          </Typography>
        </InformationMessage>
      </PageWithReturn>
    );
  }

  return (
    <PageWithReturn
      title="Create Payment Channel"
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
          Create a payment channel for rapid off-ledger payments to a specific destination.
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

        <TextField
          label="Settle Delay (seconds)"
          type="number"
          fullWidth
          value={settleDelay}
          error={!!errorSettleDelay}
          helperText={
            errorSettleDelay ||
            'Time the source must wait before closing the channel if it has unclaimed XRP'
          }
          onChange={handleSettleDelayChange}
          inputProps={{ min: 1 }}
          style={{ marginBottom: BOTTOM_SPACING }}
          autoComplete="off"
        />

        <TextField
          label="Cancel After (optional)"
          type="datetime-local"
          fullWidth
          value={cancelAfter}
          error={!!errorCancelAfter}
          helperText={errorCancelAfter || 'Time after which the channel expires'}
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
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Payment Channel'}
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
