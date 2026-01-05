import { FC, useCallback, useState } from 'react';

import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

import {
  IMPORT_MNEMONIC_PATH,
  IMPORT_SECRET_NUMBERS_PATH,
  IMPORT_SEED_PATH,
  LIST_WALLETS_PATH,
  REQUEST_LEDGER_PERMISSION_PATH
} from '../../../../constants';
import { ButtonOption } from '../../../atoms';
import { PageWithStepper } from '../../../templates';
import { ImportMnemonic } from './ImportMnemonic';
import { ImportSecretNumbers } from './ImportSecretNumbers';
import { ImportSeed } from './ImportSeed';
import { ImportLedger } from './ImportLedger';

const SECRET_TYPES = [
  {
    name: 'Ledger Hardware Wallet',
    description: 'Connect your Ledger device',
    link: ''
  },
  {
    name: 'Family Seed',
    description: 'Looks like sXXX1234XXX...',
    link: IMPORT_SEED_PATH
  },
  {
    name: 'Mnemonic',
    description: 'Based on multiple words',
    link: IMPORT_MNEMONIC_PATH
  },
  {
    name: 'Secret numbers',
    description: '8 rows of 6 digits (XUMM import)',
    link: IMPORT_SECRET_NUMBERS_PATH
  }
];

export interface ImportNewWalletProps {
  password: string;
}

export const ImportNewWallet: FC<ImportNewWalletProps> = ({ password }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(0);

  const handleBack = useCallback(() => {
    navigate(LIST_WALLETS_PATH);
  }, [navigate]);

  const handleLedgerClick = useCallback(async () => {
    // Check if HID permission is already granted
    try {
      const devices = await TransportWebHID.list();
      if (devices.length > 0) {
        // Permission already granted, proceed to import flow
        setActiveStep(1);
        return;
      }
    } catch (error) {
      console.log('WebHID not available or permission not granted:', error);
    }

    // No permission yet - open permission request page in a new tab
    // This is required because WebHID doesn't work from extension popup
    const url = chrome.runtime.getURL(`index.html#${REQUEST_LEDGER_PERMISSION_PATH}`);
    chrome.tabs.create({ url });
  }, []);

  if (activeStep === 4) {
    return (
      <ImportSecretNumbers
        activeStep={activeStep}
        password={password}
        handleBack={() => setActiveStep(0)}
      />
    );
  }

  if (activeStep === 3) {
    return (
      <ImportMnemonic
        activeStep={activeStep}
        password={password}
        handleBack={() => setActiveStep(0)}
      />
    );
  }

  if (activeStep === 2) {
    return (
      <ImportSeed activeStep={activeStep} password={password} handleBack={() => setActiveStep(0)} />
    );
  }

  if (activeStep === 1) {
    return (
      <ImportLedger
        activeStep={activeStep}
        password={password}
        handleBack={() => setActiveStep(0)}
      />
    );
  }

  return (
    <PageWithStepper steps={0} activeStep={0} handleBack={handleBack}>
      <Typography variant="h4" component="h1" style={{ marginTop: '30px' }}>
        Import Wallet
      </Typography>
      <Typography
        variant="subtitle1"
        component="h2"
        style={{ marginTop: '30px', marginBottom: '20px' }}
      >
        Please select your account secret type
      </Typography>
      {SECRET_TYPES.map(({ name, description }, index) => (
        <ButtonOption
          key={index}
          name={name}
          description={description}
          onClick={() => {
            // Special handling for Ledger: open in tab
            if (index === 0) {
              handleLedgerClick();
            } else {
              setActiveStep(index + 1);
            }
          }}
        />
      ))}
    </PageWithStepper>
  );
};
