import { FC, useCallback, useEffect, useState } from 'react';

import FingerprintIcon from '@mui/icons-material/Fingerprint';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Alert, Button, CircularProgress, Container, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { SETTINGS_PATH } from '../../../constants';
import { useWallet } from '../../../contexts';
import {
  isPasskeyEnabled,
  isPlatformAuthenticatorAvailable,
  registerPasskey,
  removePasskey
} from '../../../utils';
import { PageWithReturn } from '../../templates';

export const PasskeySetup: FC = () => {
  const navigate = useNavigate();
  const { isPasswordCorrect } = useWallet();

  const [passkeyEnabled, setPasskeyEnabled] = useState<boolean | null>(null);
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      const [enabled, available] = await Promise.all([
        isPasskeyEnabled(),
        isPlatformAuthenticatorAvailable()
      ]);
      setPasskeyEnabled(enabled);
      setPlatformAvailable(available);
    };
    checkStatus();
  }, []);

  const handleBack = useCallback(() => {
    navigate(SETTINGS_PATH);
  }, [navigate]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError('');
    setError('');
  }, []);

  const handleEnablePasskey = useCallback(async () => {
    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }

    if (!isPasswordCorrect(password)) {
      setPasswordError('Incorrect password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerPasskey(password);
      setSuccess(true);
      setPasskeyEnabled(true);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable passkey');
    } finally {
      setLoading(false);
    }
  }, [password, isPasswordCorrect]);

  const handleRemovePasskey = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await removePasskey();
      setPasskeyEnabled(false);
      setSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove passkey');
    } finally {
      setLoading(false);
    }
  }, []);

  // Loading state
  if (passkeyEnabled === null || platformAvailable === null) {
    return (
      <PageWithReturn title="Passkey" onBackClick={handleBack}>
        <Container
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '2rem'
          }}
        >
          <CircularProgress />
        </Container>
      </PageWithReturn>
    );
  }

  // Platform not available
  if (!platformAvailable) {
    return (
      <PageWithReturn title="Passkey" onBackClick={handleBack}>
        <Container style={{ marginTop: '1rem' }}>
          <Alert severity="warning">
            Passkey authentication is not available on this device. This feature requires a platform
            authenticator like Touch ID, Face ID, or Windows Hello.
          </Alert>
        </Container>
      </PageWithReturn>
    );
  }

  // Passkey already enabled - show manage view
  if (passkeyEnabled) {
    return (
      <PageWithReturn title="Passkey" onBackClick={handleBack}>
        <Container style={{ marginTop: '1rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1rem'
            }}
          >
            <CheckCircleIcon color="success" style={{ fontSize: 64 }} />
            <Typography variant="h6">Passkey Enabled</Typography>
            <Typography variant="body2" color="textSecondary">
              You can now unlock GemWallet using your device&apos;s biometric authentication (Touch
              ID, Face ID, or Windows Hello).
            </Typography>
          </div>

          {error && (
            <Alert severity="error" style={{ marginTop: '1rem' }}>
              {error}
            </Alert>
          )}

          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
            onClick={handleRemovePasskey}
            disabled={loading}
            style={{ marginTop: '2rem' }}
          >
            Remove Passkey
          </Button>

          <Typography
            variant="caption"
            color="textSecondary"
            style={{ display: 'block', marginTop: '1rem', textAlign: 'center' }}
          >
            Removing the passkey will require you to use your password to unlock GemWallet.
          </Typography>
        </Container>
      </PageWithReturn>
    );
  }

  // Setup view
  return (
    <PageWithReturn title="Passkey" onBackClick={handleBack}>
      <Container style={{ marginTop: '1rem' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <FingerprintIcon color="primary" style={{ fontSize: 64 }} />
          <Typography variant="h6">Enable Passkey</Typography>
          <Typography variant="body2" color="textSecondary">
            Use Touch ID, Face ID, or Windows Hello to quickly unlock your wallet without entering
            your password.
          </Typography>
        </div>

        {success ? (
          <Alert severity="success" style={{ marginBottom: '1rem' }}>
            Passkey has been enabled successfully!
          </Alert>
        ) : null}

        {error && (
          <Alert severity="error" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" style={{ marginBottom: '0.5rem' }}>
          Enter your password to enable passkey:
        </Typography>

        <TextField
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          error={!!passwordError}
          helperText={passwordError}
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        />

        <Button
          variant="contained"
          fullWidth
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FingerprintIcon />}
          onClick={handleEnablePasskey}
          disabled={loading || !password}
        >
          {loading ? 'Setting up...' : 'Enable Passkey'}
        </Button>

        <Typography
          variant="caption"
          color="textSecondary"
          style={{ display: 'block', marginTop: '1rem', textAlign: 'center' }}
        >
          Your password will be securely encrypted and stored. The passkey can only decrypt it after
          biometric verification.
        </Typography>
      </Container>
    </PageWithReturn>
  );
};
