import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Button, CircularProgress, Snackbar, TextField, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import { DID_PATH, SECONDARY_GRAY, STORAGE_MESSAGING_KEY } from '../../../constants';
import { buildDIDSet, useLedger, useNetwork, useWallet } from '../../../contexts';
import { useFetchFromSessionStorage } from '../../../hooks';
import { stringToHex } from '../../../utils/fetchDIDData';
import { InformationMessage } from '../../molecules';
import { PageWithReturn } from '../../templates';

const BOTTOM_SPACING = '20px';

interface StoredDIDData {
  DIDDocument?: string;
  URI?: string;
  Data?: string;
  decodedDIDDocument?: string;
  decodedURI?: string;
  decodedData?: string;
}

export const DIDSetForm: FC = () => {
  const navigate = useNavigate();
  const { getCurrentWallet } = useWallet();
  const { client } = useNetwork();
  const { didSet } = useLedger();

  // Check if we're editing an existing DID
  const urlParams = new URLSearchParams(window.location.search);
  const { fetchedData } = useFetchFromSessionStorage(
    urlParams.get(STORAGE_MESSAGING_KEY) ?? undefined
  ) as {
    fetchedData: StoredDIDData | undefined;
  };

  const isEditing = !!fetchedData;

  // Form state - use decoded values for editing
  const [didDocument, setDIDDocument] = useState('');
  const [uri, setURI] = useState('');
  const [data, setData] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletActivated, setIsWalletActivated] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (fetchedData) {
      setDIDDocument(fetchedData.decodedDIDDocument || '');
      setURI(fetchedData.decodedURI || '');
      setData(fetchedData.decodedData || '');
    }
  }, [fetchedData]);

  // Check wallet activation
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const wallet = getCurrentWallet();
        if (wallet && client) {
          await client.getXrpBalance(wallet.publicAddress);
          setIsWalletActivated(true);
        } else {
          setIsWalletActivated(false);
        }
      } catch (e) {
        setIsWalletActivated(false);
      }
    };
    checkWallet();
  }, [client, getCurrentWallet]);

  const isFormValid = useMemo(() => {
    // At least one field must be non-empty
    return didDocument.trim() !== '' || uri.trim() !== '' || data.trim() !== '';
  }, [didDocument, uri, data]);

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
      // Build the DID set transaction
      // Fields need to be hex-encoded
      const transaction = buildDIDSet(
        {
          ...(didDocument.trim() && { DIDDocument: stringToHex(didDocument.trim()) }),
          ...(uri.trim() && { URI: stringToHex(uri.trim()) }),
          ...(data.trim() && { Data: stringToHex(data.trim()) })
        },
        wallet
      );

      const result = await didSet(transaction);

      if (result.hash) {
        setSuccessMessage(isEditing ? 'DID updated successfully!' : 'DID created successfully!');
        // Navigate back to DID list after short delay
        setTimeout(() => {
          navigate(DID_PATH);
        }, 1500);
      }
    } catch (e) {
      Sentry.captureException(e);
      setErrorMessage((e as Error).message || 'Failed to save DID');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, getCurrentWallet, didDocument, uri, data, didSet, navigate, isEditing]);

  if (!isWalletActivated) {
    return (
      <PageWithReturn
        title={isEditing ? 'Update DID' : 'Create DID'}
        onBackClick={() => navigate(-1)}
      >
        <InformationMessage title="Wallet not activated">
          <Typography>
            You cannot {isEditing ? 'update' : 'create'} a DID because your wallet is not activated.
          </Typography>
        </InformationMessage>
      </PageWithReturn>
    );
  }

  return (
    <PageWithReturn
      title={isEditing ? 'Update DID' : 'Create DID'}
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
          {isEditing
            ? 'Update your Decentralized Identifier (DID) fields below.'
            : 'Create a Decentralized Identifier (DID) for your account. At least one field is required.'}
        </Typography>

        <TextField
          label="DID Document"
          fullWidth
          multiline
          rows={3}
          value={didDocument}
          onChange={(e) => setDIDDocument(e.target.value)}
          placeholder='{"id": "did:xrpl:..."}'
          helperText="JSON document containing DID information"
          style={{ marginBottom: BOTTOM_SPACING }}
          autoComplete="off"
        />

        <TextField
          label="URI"
          fullWidth
          value={uri}
          onChange={(e) => setURI(e.target.value)}
          placeholder="https://example.com/did-document"
          helperText="URL pointing to additional DID resources"
          style={{ marginBottom: BOTTOM_SPACING }}
          autoComplete="off"
        />

        <TextField
          label="Additional Data"
          fullWidth
          multiline
          rows={2}
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Optional additional data"
          helperText="Custom data to store with your DID"
          style={{ marginBottom: BOTTOM_SPACING }}
          autoComplete="off"
        />
      </div>

      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        style={{ marginTop: '20px' }}
      >
        {isSubmitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : isEditing ? (
          'Update DID'
        ) : (
          'Create DID'
        )}
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
