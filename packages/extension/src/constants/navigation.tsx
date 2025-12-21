import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import LockClockIcon from '@mui/icons-material/LockClock';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import SettingsIcon from '@mui/icons-material/Settings';

import { ESCROW_PATH, HISTORY_PATH, HOME_PATH, NFT_VIEWER_PATH, SETTINGS_PATH } from './paths';

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
    label: 'Settings',
    pathname: SETTINGS_PATH,
    icon: <SettingsIcon />
  }
];
