import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import LockIcon from '@mui/icons-material/Lock';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  ABOUT_PATH,
  DELETE_ACCOUNT_PATH,
  FAQ_LINK,
  FEEDBACK_LINK,
  PASSKEY_SETUP_PATH,
  PERMISSIONS_PATH,
  RESET_PASSWORD_PATH,
  SET_REGULAR_KEY_PATH,
  STORAGE_PERMISSION_ADVANCED_MODE,
  SUBMIT_RAW_TRANSACTION_PATH,
  TRUSTED_APPS_PATH
} from '../../../constants';
import { useWallet } from '../../../contexts';
import {
  isPasskeyEnabled,
  isPlatformAuthenticatorAvailable,
  loadFromChromeLocalStorage,
  openExternalLink
} from '../../../utils';
import { PageWithReturn } from '../../templates';
import { ItemMenuGroup, MenuGroup } from './MenuGroup';

export const Settings: FC = () => {
  const navigate = useNavigate();
  const { signOut } = useWallet();

  const [advancedModeEnabled, setAdvancedModeEnabled] = useState<boolean>(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState<boolean>(false);
  const [passkeyEnabled, setPasskeyEnabled] = useState<boolean>(false);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const loadInitialData = async () => {
      const storedData = await loadFromChromeLocalStorage(STORAGE_PERMISSION_ADVANCED_MODE);
      if (!storedData) return;

      setAdvancedModeEnabled(storedData === 'true');
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const checkPasskeyStatus = async () => {
      const [available, enabled] = await Promise.all([
        isPlatformAuthenticatorAvailable(),
        isPasskeyEnabled()
      ]);
      setPasskeyAvailable(available);
      setPasskeyEnabled(enabled);
    };

    checkPasskeyStatus();
  }, []);

  const handleLock = useCallback(() => {
    signOut();
  }, [signOut]);

  const accountParamsItems = useMemo<ItemMenuGroup[]>(
    () => [
      {
        name: 'Trusted Apps',
        type: 'button',
        onClick: () => navigate(TRUSTED_APPS_PATH)
      },
      {
        name: 'Permissions',
        type: 'button',
        onClick: () => navigate(PERMISSIONS_PATH)
      }
    ],
    [navigate]
  );

  const securityItems = useMemo<ItemMenuGroup[]>(() => {
    const items: ItemMenuGroup[] = [];

    if (passkeyAvailable) {
      items.push({
        name: passkeyEnabled ? 'Manage Passkey' : 'Enable Passkey',
        type: 'button',
        onClick: () => navigate(PASSKEY_SETUP_PATH)
      });
    }

    return items;
  }, [navigate, passkeyAvailable, passkeyEnabled]);

  const infoItems = useMemo<ItemMenuGroup[]>(
    () => [
      {
        name: 'Help',
        type: 'link',
        onClick: () => openExternalLink(FAQ_LINK)
      },
      {
        name: 'Leave A Feedback',
        type: 'link',
        onClick: () => openExternalLink(FEEDBACK_LINK)
      },
      {
        name: 'About',
        type: 'button',
        onClick: () => navigate(ABOUT_PATH)
      }
    ],
    [navigate]
  );

  const advancedItems = useMemo<ItemMenuGroup[]>(
    () => [
      {
        name: 'Set Regular Key',
        type: 'button',
        onClick: () => navigate(`${SET_REGULAR_KEY_PATH}?inAppCall=true`)
      },
      {
        name: 'Submit Raw Transaction',
        type: 'button',
        onClick: () => navigate(SUBMIT_RAW_TRANSACTION_PATH)
      }
    ],
    [navigate]
  );

  const dangerZoneItems = useMemo<ItemMenuGroup[]>(
    () => [
      {
        name: 'Reset Password',
        type: 'button',
        onClick: () => navigate(RESET_PASSWORD_PATH)
      },
      {
        name: 'Delete Account',
        type: 'button',
        onClick: () => navigate(DELETE_ACCOUNT_PATH)
      }
    ],
    [navigate]
  );

  return (
    <PageWithReturn title="Settings" onBackClick={handleBack}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}
      >
        <div style={{ paddingBottom: '0.75rem' }}>
          <MenuGroup sectionName={'Account settings'} items={accountParamsItems} />
          {securityItems.length > 0 ? (
            <MenuGroup sectionName={'Security'} items={securityItems} />
          ) : null}
          <MenuGroup sectionName={'Informations'} items={infoItems} />
          {advancedModeEnabled ? (
            <MenuGroup sectionName={'Advanced'} items={advancedItems} />
          ) : null}
          <MenuGroup sectionName={'Danger zone'} items={dangerZoneItems} />
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<LockIcon />}
            onClick={handleLock}
          >
            Lock wallet
          </Button>
        </div>
      </div>
    </PageWithReturn>
  );
};
