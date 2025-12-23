import { FC, useCallback } from 'react';

import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import HistoryIcon from '@mui/icons-material/History';
import LockClockIcon from '@mui/icons-material/LockClock';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import OutboundIcon from '@mui/icons-material/Outbound';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  CHECKS_PATH,
  DID_PATH,
  ESCROW_PATH,
  HISTORY_PATH,
  HOME_PATH,
  NFT_VIEWER_PATH,
  PAYMENT_CHANNELS_PATH,
  RECEIVE_PATH,
  SEND_PATH,
  SETTINGS_PATH
} from '../../../constants';

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
}

const ACTION_ITEMS: ActionItem[] = [
  {
    label: 'Send',
    icon: <OutboundIcon sx={{ transform: 'rotate(-45deg)' }} />,
    path: SEND_PATH,
    color: '#2196F3'
  },
  {
    label: 'Receive',
    icon: <OutboundIcon sx={{ transform: 'rotate(135deg)' }} />,
    path: RECEIVE_PATH,
    color: '#4CAF50'
  },
  {
    label: 'Swap',
    icon: <SwapHorizIcon />,
    path: HOME_PATH, // TODO: Add swap path when available
    color: '#9C27B0'
  },
  {
    label: 'History',
    icon: <HistoryIcon />,
    path: HISTORY_PATH,
    color: '#FF9800'
  },
  {
    label: 'NFTs',
    icon: <PhotoCameraBackIcon />,
    path: NFT_VIEWER_PATH,
    color: '#E91E63'
  },
  {
    label: 'Escrow',
    icon: <LockClockIcon />,
    path: ESCROW_PATH,
    color: '#00BCD4'
  },
  {
    label: 'Checks',
    icon: <MonetizationOnIcon />,
    path: CHECKS_PATH,
    color: '#8BC34A'
  },
  {
    label: 'Channels',
    icon: <AccountBalanceIcon />,
    path: PAYMENT_CHANNELS_PATH,
    color: '#3F51B5'
  },
  {
    label: 'DID',
    icon: <FingerprintIcon />,
    path: DID_PATH,
    color: '#9575CD'
  },
  {
    label: 'Tokens',
    icon: <AccountBalanceWalletIcon />,
    path: HOME_PATH,
    color: '#607D8B'
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    path: SETTINGS_PATH,
    color: '#795548'
  }
];

interface ActionGridItemProps {
  item: ActionItem;
  onClick: () => void;
}

const ActionGridItem: FC<ActionGridItemProps> = ({ item, onClick }) => {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1.5,
        borderRadius: 2,
        cursor: 'pointer',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: 'none'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: item.color || '#1976d2',
          marginBottom: 1,
          '& svg': {
            fontSize: 22,
            color: 'white'
          }
        }}
      >
        {item.icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: 'text.primary',
          fontWeight: 500,
          fontSize: '0.7rem',
          textAlign: 'center'
        }}
      >
        {item.label}
      </Typography>
    </Paper>
  );
};

export interface ActionGridProps {
  excludeItems?: string[]; // Labels of items to exclude
}

export const ActionGrid: FC<ActionGridProps> = ({ excludeItems = ['Tokens'] }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));

  const handleItemClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const filteredItems = ACTION_ITEMS.filter((item) => !excludeItems.includes(item.label));

  // Responsive: 4 columns on larger screens, 3 on smaller
  const columns = isLargeScreen ? 4 : 3;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 1.5,
        padding: 1
      }}
    >
      {filteredItems.map((item) => (
        <ActionGridItem key={item.label} item={item} onClick={() => handleItemClick(item.path)} />
      ))}
    </Box>
  );
};
