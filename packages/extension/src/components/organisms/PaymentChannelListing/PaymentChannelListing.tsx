import { FC, useCallback, useEffect, useState } from 'react';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, CircularProgress, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import {
  PAYMENT_CHANNEL_CLAIM_PATH,
  PAYMENT_CHANNEL_CREATE_FORM_PATH,
  PAYMENT_CHANNEL_FUND_PATH,
  SECONDARY_GRAY,
  STORAGE_MESSAGING_KEY
} from '../../../constants';
import { useNetwork } from '../../../contexts';
import {
  PaymentChannelDisplayData,
  fetchAllPaymentChannelDisplayData
} from '../../../utils/fetchPaymentChannelData';
import { generateKey, saveInChromeSessionStorage } from '../../../utils';
import { PaymentChannelCard } from '../../molecules/PaymentChannelCard';
import { InformationMessage } from '../../molecules/InformationMessage';

export interface PaymentChannelListingProps {
  address: string;
}

export const PaymentChannelListing: FC<PaymentChannelListingProps> = ({ address }) => {
  const [channels, setChannels] = useState<PaymentChannelDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useNetwork();
  const navigate = useNavigate();

  const fetchChannels = useCallback(async () => {
    if (!client) {
      setIsLoading(false);
      setError('Not connected to network');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAllPaymentChannelDisplayData(client, address);
      setChannels(data);
    } catch (e) {
      Sentry.captureException(e);
      console.error('Error fetching payment channels:', e);
      setError('Failed to fetch payment channels');
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreateClick = useCallback(() => {
    navigate(PAYMENT_CHANNEL_CREATE_FORM_PATH);
  }, [navigate]);

  const handleFundClick = useCallback(
    (channel: PaymentChannelDisplayData) => {
      const key = generateKey();
      saveInChromeSessionStorage(
        key,
        JSON.stringify({
          channel: channel.index,
          // Default amount is empty - user will specify
          amount: '0'
        })
      ).then(() => {
        navigate(`${PAYMENT_CHANNEL_FUND_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
      });
    },
    [navigate]
  );

  const handleClaimClick = useCallback(
    (channel: PaymentChannelDisplayData) => {
      const key = generateKey();
      saveInChromeSessionStorage(
        key,
        JSON.stringify({
          channel: channel.index
        })
      ).then(() => {
        navigate(`${PAYMENT_CHANNEL_CLAIM_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
      });
    },
    [navigate]
  );

  // Loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <CircularProgress />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <InformationMessage title="Error">
        <Typography style={{ marginBottom: '15px' }}>{error}</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchChannels}>
          Retry
        </Button>
      </InformationMessage>
    );
  }

  // Empty state
  if (channels.length === 0) {
    return (
      <div>
        <InformationMessage title="No Payment Channels Found">
          <AccountBalanceWalletIcon
            style={{ fontSize: 48, color: SECONDARY_GRAY, marginBottom: '10px' }}
          />
          <Typography style={{ marginBottom: '15px', color: SECONDARY_GRAY }}>
            You don't have any active payment channels.
          </Typography>
          <Typography
            variant="body2"
            style={{ marginBottom: '20px', color: SECONDARY_GRAY, maxWidth: '280px' }}
          >
            Payment channels allow you to make rapid, off-ledger payments to a specific destination.
            They're ideal for streaming payments or frequent micro-transactions.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Payment Channel
          </Button>
        </InformationMessage>
      </div>
    );
  }

  // List payment channels
  return (
    <div>
      {/* Header with create button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}
      >
        <Typography
          variant="subtitle1"
          style={{
            color: SECONDARY_GRAY,
            fontWeight: 600
          }}
        >
          Your Payment Channels ({channels.length})
        </Typography>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleCreateClick}>
          Create
        </Button>
      </div>

      {/* Payment Channel list */}
      {channels.map((channel) => (
        <PaymentChannelCard
          key={channel.index}
          channel={channel}
          currentAddress={address}
          onFundClick={channel.canFund ? handleFundClick : undefined}
          onClaimClick={channel.canClaim ? handleClaimClick : undefined}
        />
      ))}
    </div>
  );
};
