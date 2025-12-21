import { FC, useCallback, useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import LockClockIcon from '@mui/icons-material/LockClock';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, CircularProgress, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import {
  ESCROW_CANCEL_PATH,
  ESCROW_CREATE_FORM_PATH,
  ESCROW_FINISH_PATH,
  SECONDARY_GRAY,
  STORAGE_MESSAGING_KEY
} from '../../../constants';
import { useNetwork } from '../../../contexts';
import { EscrowDisplayData, fetchAllEscrowDisplayData } from '../../../utils/fetchEscrowData';
import { generateKey, saveInChromeSessionStorage } from '../../../utils';
import { EscrowCard } from '../../molecules/EscrowCard';
import { InformationMessage } from '../../molecules/InformationMessage';

export interface EscrowListingProps {
  address: string;
}

export const EscrowListing: FC<EscrowListingProps> = ({ address }) => {
  const [escrows, setEscrows] = useState<EscrowDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useNetwork();
  const navigate = useNavigate();

  const fetchEscrows = useCallback(async () => {
    if (!client) {
      setIsLoading(false);
      setError('Not connected to network');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAllEscrowDisplayData(client, address);
      setEscrows(data);
    } catch (e) {
      Sentry.captureException(e);
      console.error('Error fetching escrows:', e);
      setError('Failed to fetch escrows');
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const handleCreateClick = useCallback(() => {
    navigate(ESCROW_CREATE_FORM_PATH);
  }, [navigate]);

  const handleFinishClick = useCallback(
    (escrow: EscrowDisplayData) => {
      const key = generateKey();
      saveInChromeSessionStorage(
        key,
        JSON.stringify({
          owner: escrow.Account,
          offerSequence: escrow.PreviousTxnLgrSeq,
          escrowIndex: escrow.index,
          amount: escrow.Amount,
          destination: escrow.Destination,
          condition: escrow.Condition
        })
      ).then(() => {
        navigate(`${ESCROW_FINISH_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
      });
    },
    [navigate]
  );

  const handleCancelClick = useCallback(
    (escrow: EscrowDisplayData) => {
      const key = generateKey();
      saveInChromeSessionStorage(
        key,
        JSON.stringify({
          owner: escrow.Account,
          offerSequence: escrow.PreviousTxnLgrSeq,
          escrowIndex: escrow.index,
          amount: escrow.Amount
        })
      ).then(() => {
        navigate(`${ESCROW_CANCEL_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
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
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchEscrows}>
          Retry
        </Button>
      </InformationMessage>
    );
  }

  // Empty state
  if (escrows.length === 0) {
    return (
      <div>
        <InformationMessage title="No Escrows Found">
          <LockClockIcon style={{ fontSize: 48, color: SECONDARY_GRAY, marginBottom: '10px' }} />
          <Typography style={{ marginBottom: '15px', color: SECONDARY_GRAY }}>
            You don't have any active escrows.
          </Typography>
          <Typography
            variant="body2"
            style={{ marginBottom: '20px', color: SECONDARY_GRAY, maxWidth: '280px' }}
          >
            Escrows allow you to lock XRP that can be released when certain conditions are met, such
            as a specific time or cryptographic fulfillment.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Escrow
          </Button>
        </InformationMessage>
      </div>
    );
  }

  // List escrows
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
          Your Escrows ({escrows.length})
        </Typography>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleCreateClick}>
          Create
        </Button>
      </div>

      {/* Escrow list */}
      {escrows.map((escrow) => (
        <EscrowCard
          key={escrow.index}
          escrow={escrow}
          currentAddress={address}
          onFinishClick={escrow.canFinish ? handleFinishClick : undefined}
          onCancelClick={escrow.canCancel ? handleCancelClick : undefined}
        />
      ))}
    </div>
  );
};
