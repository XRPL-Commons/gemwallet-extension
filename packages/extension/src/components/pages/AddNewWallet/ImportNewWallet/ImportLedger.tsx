import { FC, useState, useCallback, useEffect } from 'react';
import {
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
    console.log('loadAccounts called - starting connection process...');
    setLoading(true);
    setError(null);
    setDeviceState(null);

    try {
      console.log('Calling getLedgerAccounts...');
      const ledgerAccounts = await getLedgerAccounts(accountCount, 0);
      console.log('Received accounts:', ledgerAccounts);

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
          Name Your Ledger Wallet
        </Typography>

        {selectedAccount && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Address:</strong> {selectedAccount.address}
              </Typography>
              <Typography variant="body2">
                <strong>Path:</strong> {selectedAccount.path}
              </Typography>
            </Alert>
          </Box>
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
        />
      </PageWithStepper>
    );
  }

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

      <Typography variant="body2" style={{ marginTop: '20px', marginBottom: '20px' }}>
        Connect your Ledger device and select an account to import.
      </Typography>

      {deviceState && deviceState !== LedgerDeviceState.READY && (
        <LedgerDeviceStatus
          state={deviceState}
          customMessage={error || undefined}
        />
      )}

      {error && !deviceState && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && accounts.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Select an account:
          </Typography>
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {accounts.map((account) => (
              <ListItem key={account.path} disablePadding>
                <ListItemButton onClick={() => handleAccountSelect(account)}>
                  <ListItemText
                    primary={`Account ${account.index}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {account.address}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {account.path}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {!loading && accounts.length === 0 && !error && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Click "Connect to Ledger" to search for accounts on your Ledger device.
        </Alert>
      )}
    </PageWithStepper>
  );
};
