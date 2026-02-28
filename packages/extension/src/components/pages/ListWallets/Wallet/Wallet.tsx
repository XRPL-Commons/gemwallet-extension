import { FC, useMemo } from 'react';

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { EDIT_WALLET_PATH } from '../../../../constants';
import { injectPathParams, truncateAddress } from '../../../../utils';
import { useGemTokens } from '../../../../hooks';
import { WalletIcon } from '../../../atoms';

export interface WalletProps {
  publicAddress: string;
  name: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const Wallet: FC<WalletProps> = ({ publicAddress, name, isSelected = false, onClick }) => {
  const tokens = useGemTokens();
  const navigate = useNavigate();

  const truncatedAddress = useMemo(() => truncateAddress(publicAddress), [publicAddress]);

  return (
    <Paper
      elevation={isSelected ? 15 : 5}
      style={{
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        cursor: 'pointer',
        border: isSelected ? `solid 1px ${tokens.text.secondary}` : 'none'
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <WalletIcon publicAddress={publicAddress} />
        <div style={{ marginLeft: '10px' }}>
          <Typography
            style={{
              width: '190px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {name}
          </Typography>
          <Typography variant="body2" style={{ color: tokens.text.secondary }}>
            {truncatedAddress}
          </Typography>
        </div>
      </div>
      <IconButton
        aria-label="More"
        onClick={(e) => {
          e.stopPropagation();
          navigate(injectPathParams(EDIT_WALLET_PATH, { publicAddress }));
        }}
      >
        <MoreHorizIcon />
      </IconButton>
    </Paper>
  );
};
