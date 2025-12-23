import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import HistoryIcon from '@mui/icons-material/History';
import LockClockIcon from '@mui/icons-material/LockClock';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import SettingsIcon from '@mui/icons-material/Settings';

import {
  CHECKS_PATH,
  DID_PATH,
  ESCROW_PATH,
  HISTORY_PATH,
  HOME_PATH,
  NFT_VIEWER_PATH,
  PAYMENT_CHANNELS_PATH,
  SETTINGS_PATH
} from './paths';

export const navigation = [
  {
    label: 'Tokens',
    pathname: HOME_PATH,
    icon: <AccountBalanceWalletIcon />
  },
  {
    label: 'History',
    pathname: HISTORY_PATH,
    icon: <HistoryIcon />
  },
  {
    label: 'NFTs',
    pathname: NFT_VIEWER_PATH,
    icon: <PhotoCameraBackIcon />
  },
  {
    label: 'Escrow',
    pathname: ESCROW_PATH,
    icon: <LockClockIcon />
  },
  {
    label: 'Checks',
    pathname: CHECKS_PATH,
    icon: <MonetizationOnIcon />
  },
  {
    label: 'Channels',
    pathname: PAYMENT_CHANNELS_PATH,
    icon: <AccountBalanceIcon />
  },
  {
    label: 'DID',
    pathname: DID_PATH,
    icon: <FingerprintIcon />
  },
  {
    label: 'Settings',
    pathname: SETTINGS_PATH,
    icon: <SettingsIcon />
  }
];
