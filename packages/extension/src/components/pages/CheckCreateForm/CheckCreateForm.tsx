import { FC, FocusEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isValidAddress } from 'xrpl';

import {
  CHECK_CREATE_PATH,
  DEFAULT_RESERVE,
  RESERVE_PER_OWNER,
  SECONDARY_GRAY,
  STORAGE_MESSAGING_KEY
} from '../../../constants';
import { useLedger, useNetwork, useServer, useWallet } from '../../../contexts';
import { generateKey, saveInChromeSessionStorage } from '../../../utils';
import { NumericInput } from '../../atoms';
import { InformationMessage } from '../../molecules';
import { PageWithReturn } from '../../templates';

const BOTTOM_SPACING = '20px';

// Minimum expiration date is 1 hour from now
const getMinDateTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
};

// Convert JavaScript Date to Ripple time (seconds since Jan 1, 2000)
const dateToRippleTime = (date: Date): number => {
  const RIPPLE_EPOCH = 946684800;
  return Math.floor(date.getTime() / 1000) - RIPPLE_EPOCH;
};

export const CheckCreateForm: FC = () => {
  const navigate = useNavigate();
  const { getCurrentWallet } = useWallet();
  const { client } = useNetwork();
  const { serverInfo } = useServer();
  const { getAccountInfo } = useLedger();

  // Form state
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [expiration, setExpiration] = useState('');

  // Error state
  const [errorDestination, setErrorDestination] = useState('');
  const [errorAmount, setErrorAmount] = useState('');
  const [errorExpiration, setErrorExpiration] = useState('');

  // UI state
  const [isWalletActivated, setIsWalletActivated] = useState(true);
  const [ownerCount, setOwnerCount] = useState(0);
  const [balance, setBalance] = useState(0);

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
      errorDestination === '' &&
      errorAmount === '' &&
      errorExpiration === ''
    );
  }, [destination, amount, errorDestination, errorAmount, errorExpiration]);

  const handleDestinationChange = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    setErrorDestination('');
  }, []);

  const handleDestinationBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const wallet = getCurrentWallet();
      if (e.target.value === wallet?.publicAddress) {
        setErrorDestination('You cannot create a check to yourself');
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

  const handleExpirationChange = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpiration(value);
    setErrorExpiration('');

    if (value) {
      const expirationDate = new Date(value);
      const now = new Date();
      if (expirationDate <= now) {
        setErrorExpiration('Expiration must be in the future');
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    // Convert amount to drops
    const amountDrops = String(Math.floor(Number(amount) * 1_000_000));

    // Save transaction data to session storage and navigate to confirmation page
    const key = generateKey();
    await saveInChromeSessionStorage(
      key,
      JSON.stringify({
        destination,
        sendMax: amountDrops,
        ...(expiration && { expiration: dateToRippleTime(new Date(expiration)) })
      })
    );

    navigate(`${CHECK_CREATE_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
  }, [isFormValid, amount, destination, expiration, navigate]);

  if (!isWalletActivated) {
    return (
      <PageWithReturn title="Create Check" onBackClick={() => navigate(-1)}>
        <InformationMessage title="Wallet not activated">
          <Typography>You cannot create a check because your wallet is not activated.</Typography>
        </InformationMessage>
      </PageWithReturn>
    );
  }

  return (
    <PageWithReturn
      title="Create Check"
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
          Create a check that can be cashed by the destination address.
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
          label="Expiration (optional)"
          type="datetime-local"
          fullWidth
          value={expiration}
          error={!!errorExpiration}
          helperText={errorExpiration || 'Time after which the check expires'}
          onChange={handleExpirationChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: getMinDateTime() }}
          style={{ marginBottom: BOTTOM_SPACING }}
        />
      </div>

      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        disabled={!isFormValid}
        style={{ marginTop: '20px' }}
      >
        Continue
      </Button>
    </PageWithReturn>
  );
};
