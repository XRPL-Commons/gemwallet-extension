import { FC, useState, useCallback, useEffect } from 'react';
import {
  Typography,
  TextField,
  Alert,
  Box,
  Paper,
  keyframes
} from '@mui/material';
import UsbIcon from '@mui/icons-material/Usb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';

import loadingAnimation from '../../../../assets/loading.json';
import { LIST_WALLETS_PATH } from '../../../../constants';
import { PageWithStepper } from '../../../templates';
import { useWallet } from '../../../../contexts';
import { LedgerDeviceStatus } from '../../../organisms';
import {
  getLedgerAccounts,
  isBrowserSupported,
  LedgerDeviceState,
  parseLedgerError,
  type LedgerAccount
} from '../../../../utils/ledger';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export interface ImportLedgerProps {
  activeStep: number;
  password: string;
  handleBack: () => void;
}

export const ImportLedger: FC<ImportLedgerProps> = ({ activeStep, password, handleBack }) => {
  const navigate = useNavigate();
  const { importLedgerWallet } = useWallet();

  const [step, setStep] = useState<'select' | 'name'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<LedgerDeviceState | null>(null);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null);
  const [walletName, setWalletName] = useState('');
  const accountCount = 5;

  // Check browser support on mount
  useEffect(() => {
    const browserSupport = isBrowserSupported();
    if (!browserSupport.supported) {
      setError(browserSupport.message || 'Browser not supported');
      setDeviceState(LedgerDeviceState.UNKNOWN);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeviceState(null);

    try {
      const ledgerAccounts = await getLedgerAccounts(accountCount, 0);

      if (ledgerAccounts.length === 0) {
        setError('No accounts found on Ledger device');
        return;
      }

      setAccounts(ledgerAccounts);
      setDeviceState(LedgerDeviceState.READY);
    } catch (err) {
      console.error('Error loading accounts:', err);
      const { state, message } = parseLedgerError(err);
      setDeviceState(state);
      setError(message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [accountCount]);

  const handleAccountSelect = useCallback((account: LedgerAccount) => {
    setSelectedAccount(account);
    setWalletName(`Ledger ${account.index + 1}`);
    setStep('name');
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedAccount || !walletName.trim()) {
      setError('Please enter a wallet name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await importLedgerWallet({
        name: walletName.trim(),
        publicAddress: selectedAccount.address,
        publicKey: selectedAccount.publicKey,
        derivationPath: selectedAccount.path,
        password
      });

      navigate(LIST_WALLETS_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Ledger wallet');
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, walletName, password, importLedgerWallet, navigate]);

  const handleBackClick = useCallback(() => {
    if (step === 'name') {
      setStep('select');
      setSelectedAccount(null);
      setError(null);
    } else {
      handleBack();
    }
  }, [step, handleBack]);

  // Naming step
  if (step === 'name') {
    return (
      <PageWithStepper
        steps={2}
        activeStep={activeStep}
        handleBack={handleBackClick}
        handleNext={handleImport}
        disabledNext={!walletName.trim() || loading}
      >
        <Typography variant="h4" component="h1" style={{ marginTop: '30px' }}>
          Name Your Wallet
        </Typography>

        {selectedAccount && (
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                Selected Account
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 0.5 }}
            >
              {selectedAccount.address}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Path: {selectedAccount.path}
            </Typography>
          </Paper>
        )}

        <TextField
          label="Wallet Name"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          fullWidth
          autoFocus
          margin="normal"
          error={!!error}
          helperText={error}
          disabled={loading}
          sx={{ mt: 3 }}
        />
      </PageWithStepper>
    );
  }

  // Account selection step
  return (
    <PageWithStepper
      steps={2}
      activeStep={activeStep}
      handleBack={handleBackClick}
      handleNext={accounts.length > 0 ? undefined : loadAccounts}
      buttonText={accounts.length > 0 ? undefined : 'Connect to Ledger'}
      disabledNext={loading}
    >
      <Typography variant="h4" component="h1" style={{ marginTop: '30px' }}>
        Import Ledger Wallet
      </Typography>

      {/* Ledger Icon Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 3,
          mb: 3
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <UsbIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Connect your Ledger device and select an account to import.
        </Typography>
      </Box>

      {/* Device Status */}
      {deviceState && deviceState !== LedgerDeviceState.READY && (
        <LedgerDeviceStatus
          state={deviceState}
          customMessage={error || undefined}
          onConnect={loadAccounts}
        />
      )}

      {error && !deviceState && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3
          }}
        >
          <Lottie
            animationData={loadingAnimation}
            loop
            style={{ width: 100, height: 100 }}
          />
          <Typography variant="body1" sx={{ mt: 1 }}>
            Connecting to Ledger...
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
            Please make sure your device is connected and unlocked
          </Typography>
        </Box>
      )}

      {/* Account List */}
      {!loading && accounts.length > 0 && (
        <Box sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Select an account
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {accounts.map((account) => (
              <Paper
                key={account.path}
                elevation={0}
                onClick={() => handleAccountSelect(account)}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <AccountBalanceWalletIcon
                      sx={{ fontSize: 20, color: 'text.secondary' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Account {account.index}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {account.address}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {account.path}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Initial State */}
      {!loading && accounts.length === 0 && !error && !deviceState && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Click "Connect to Ledger" to search for accounts on your device.
          </Typography>
        </Paper>
      )}
    </PageWithStepper>
  );
};
