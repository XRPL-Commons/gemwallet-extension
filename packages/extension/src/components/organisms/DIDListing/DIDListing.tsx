import { FC, useCallback, useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, CircularProgress, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import {
  DID_DELETE_PATH,
  DID_SET_FORM_PATH,
  SECONDARY_GRAY,
  STORAGE_MESSAGING_KEY
} from '../../../constants';
import { useNetwork } from '../../../contexts';
import { DIDDisplayData, fetchDIDDisplayData } from '../../../utils/fetchDIDData';
import { generateKey, saveInChromeSessionStorage } from '../../../utils';
import { DIDCard } from '../../molecules/DIDCard';
import { InformationMessage } from '../../molecules/InformationMessage';

export interface DIDListingProps {
  address: string;
}

export const DIDListing: FC<DIDListingProps> = ({ address }) => {
  const [did, setDID] = useState<DIDDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useNetwork();
  const navigate = useNavigate();

  const fetchDID = useCallback(async () => {
    if (!client) {
      setIsLoading(false);
      setError('Not connected to network');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDIDDisplayData(client, address);
      setDID(data);
    } catch (e) {
      Sentry.captureException(e);
      console.error('Error fetching DID:', e);
      setError('Failed to fetch DID');
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  useEffect(() => {
    fetchDID();
  }, [fetchDID]);

  const handleCreateClick = useCallback(() => {
    navigate(DID_SET_FORM_PATH);
  }, [navigate]);

  const handleEditClick = useCallback(() => {
    if (!did) return;

    const key = generateKey();
    saveInChromeSessionStorage(
      key,
      JSON.stringify({
        DIDDocument: did.DIDDocument,
        URI: did.URI,
        Data: did.Data,
        decodedDIDDocument: did.decodedDIDDocument,
        decodedURI: did.decodedURI,
        decodedData: did.decodedData
      })
    ).then(() => {
      navigate(`${DID_SET_FORM_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
    });
  }, [did, navigate]);

  const handleDeleteClick = useCallback(() => {
    const key = generateKey();
    saveInChromeSessionStorage(key, JSON.stringify({})).then(() => {
      navigate(`${DID_DELETE_PATH}?inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`);
    });
  }, [navigate]);

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
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchDID}>
          Retry
        </Button>
      </InformationMessage>
    );
  }

  // Empty state - no DID exists
  if (!did) {
    return (
      <div>
        <InformationMessage title="No DID Found">
          <FingerprintIcon style={{ fontSize: 48, color: SECONDARY_GRAY, marginBottom: '10px' }} />
          <Typography style={{ marginBottom: '15px', color: SECONDARY_GRAY }}>
            You don't have a DID associated with this account.
          </Typography>
          <Typography
            variant="body2"
            style={{ marginBottom: '20px', color: SECONDARY_GRAY, maxWidth: '280px' }}
          >
            A Decentralized Identifier (DID) allows you to create a verifiable, self-sovereign
            digital identity on the XRP Ledger.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create DID
          </Button>
        </InformationMessage>
      </div>
    );
  }

  // DID exists - show card
  return (
    <div>
      {/* Header */}
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
          Your DID
        </Typography>
      </div>

      {/* DID Card */}
      <DIDCard did={did} onEditClick={handleEditClick} onDeleteClick={handleDeleteClick} />
    </div>
  );
};
