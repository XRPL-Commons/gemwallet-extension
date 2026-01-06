import { FC, useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Alert, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

import { PageWithTitle } from '../../templates';
import { HARDWARE_WALLET_PATH } from '../../../constants';

/**
 * Request Ledger Permission Page
 * This page MUST open in a browser tab (not popup) for WebHID to work properly
 */
export const RequestLedgerPermission: FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'instructions' | 'requesting' | 'success'>('instructions');

  // Auto-redirect if already has permission
  useEffect(() => {
    checkExistingPermission();
  }, []);

  const checkExistingPermission = async () => {
    try {
      const devices = await TransportWebHID.list();
      if (devices.length > 0) {
        // Already has permission, redirect to account selection
        setStep('success');
        setTimeout(() => {
          navigate('/import/ledger', { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to check existing permission:', error);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    setError(null);
    setStep('requesting');

    try {
      // This will trigger the browser's HID device picker
      // ONLY works when called from a tab (not popup)
      const transport = await TransportWebHID.create();

      // Close the transport immediately (we just needed permission)
      await transport.close();

      setStep('success');
      setLoading(false);

      // Store a flag that permission was granted
      await chrome.storage.local.set({ ledgerPermissionGranted: true });

      // Close this tab after a short delay - user will continue in popup
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error: any) {
      console.error('[RequestPermission] Failed to get permission:', error);
      setLoading(false);
      setStep('instructions');

      if (error?.message?.includes('No device selected') ||
          error?.name === 'NotFoundError') {
        setError('No device selected. Please make sure your Ledger is connected and try again.');
      } else if (error?.message?.includes('cancelled')) {
        setError('Permission request was cancelled. Please try again.');
      } else {
        setError(error.message || 'Failed to connect to Ledger device');
      }
    }
  };

  return (
    <PageWithTitle
      title="Connect Ledger"
      styles={{ container: { display: 'flex', flexDirection: 'column', rowGap: '20px' } }}
    >
      {step === 'instructions' && (
        <>
          <Typography variant="body1" gutterBottom>
            To use your Ledger hardware wallet with GemWallet, you need to grant permission to access it.
          </Typography>

          <Box sx={{ my: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Before continuing, make sure:
            </Typography>
            <Typography variant="body2" component="div">
              <ol style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li>Your Ledger device is connected via USB</li>
                <li>Your Ledger is unlocked (PIN entered)</li>
                <li>The XRP application is open on your Ledger</li>
              </ol>
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(HARDWARE_WALLET_PATH)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={requestPermission}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Grant Permission'}
            </Button>
          </Box>
        </>
      )}

      {step === 'requesting' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Requesting Permission
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Please select your Ledger device from the browser popup
          </Typography>
        </Box>
      )}

      {step === 'success' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
            Permission granted successfully!
          </Alert>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            This tab will close automatically.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Please return to the GemWallet popup and click "Ledger Hardware Wallet" again to import your accounts.
          </Typography>
        </Box>
      )}
    </PageWithTitle>
  );
};
