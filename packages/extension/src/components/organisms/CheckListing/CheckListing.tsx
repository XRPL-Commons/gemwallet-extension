import { FC, useCallback, useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, CircularProgress, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import {
  CHECK_CANCEL_PATH,
  CHECK_CASH_PATH,
  CHECK_CREATE_FORM_PATH,
  SECONDARY_GRAY,
  STORAGE_MESSAGING_KEY
} from '../../../constants';
import { useNetwork } from '../../../contexts';
import { CheckDisplayData, fetchAllCheckDisplayData } from '../../../utils/fetchCheckData';
import { generateKey, saveInChromeSessionStorage } from '../../../utils';
import { CheckCard } from '../../molecules/CheckCard';
import { InformationMessage } from '../../molecules/InformationMessage';

export interface CheckListingProps {
  address: string;
}

export const CheckListing: FC<CheckListingProps> = ({ address }) => {
  const [checks, setChecks] = useState<CheckDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useNetwork();
  const navigate = useNavigate();

  const fetchChecks = useCallback(async () => {
    if (!client) {
      setIsLoading(false);
      setError('Not connected to network');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAllCheckDisplayData(client, address);
      setChecks(data);
    } catch (e) {
      Sentry.captureException(e);
      console.error('Error fetching checks:', e);
      setError('Failed to fetch checks');
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const handleCreateClick = useCallback(() => {
    navigate(CHECK_CREATE_FORM_PATH);
  }, [navigate]);

  const handleCashClick = useCallback(
    async (check: CheckDisplayData) => {
      try {
        const key = generateKey();
        await saveInChromeSessionStorage(
          key,
          JSON.stringify({
            checkID: check.index,
            amount: typeof check.SendMax === 'string' ? check.SendMax : check.SendMax.value
          })
        );
        navigate(`${CHECK_CASH_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
      } catch (e) {
        console.error('Error saving check data:', e);
        Sentry.captureException(e);
      }
    },
    [navigate]
  );

  const handleCancelClick = useCallback(
    async (check: CheckDisplayData) => {
      try {
        const key = generateKey();
        await saveInChromeSessionStorage(
          key,
          JSON.stringify({
            checkID: check.index
          })
        );
        navigate(`${CHECK_CANCEL_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
      } catch (e) {
        console.error('Error saving check data:', e);
        Sentry.captureException(e);
      }
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
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchChecks}>
          Retry
        </Button>
      </InformationMessage>
    );
  }

  // Empty state
  if (checks.length === 0) {
    return (
      <div>
        <InformationMessage title="No Checks Found">
          <MonetizationOnIcon
            style={{ fontSize: 48, color: SECONDARY_GRAY, marginBottom: '10px' }}
          />
          <Typography style={{ marginBottom: '15px', color: SECONDARY_GRAY }}>
            You don't have any active checks.
          </Typography>
          <Typography
            variant="body2"
            style={{ marginBottom: '20px', color: SECONDARY_GRAY, maxWidth: '280px' }}
          >
            Checks are deferred payments that can be cashed by the destination account at their
            convenience. The sender can cancel uncashed checks.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Check
          </Button>
        </InformationMessage>
      </div>
    );
  }

  // List checks
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
          Your Checks ({checks.length})
        </Typography>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleCreateClick}>
          Create
        </Button>
      </div>

      {/* Check list */}
      {checks.map((check) => (
        <CheckCard
          key={check.index}
          check={check}
          currentAddress={address}
          onCashClick={check.canCash ? handleCashClick : undefined}
          onCancelClick={check.canCancel ? handleCancelClick : undefined}
        />
      ))}
    </div>
  );
};
