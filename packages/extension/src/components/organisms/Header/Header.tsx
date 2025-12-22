import { FC, useCallback, useMemo, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import copyToClipboard from 'copy-to-clipboard';
import { useNavigate } from 'react-router-dom';

import {
  HEADER_HEIGHT_WITHOUT_PADDING,
  LIST_WALLETS_PATH,
  SECONDARY_GRAY
} from '../../../constants';
import { useTimeout } from '../../../hooks';
import { WalletLedger } from '../../../types';
import { truncateAddress, truncateWalletName } from '../../../utils';
import { WalletIcon } from '../../atoms';
import { NetworkIndicator } from '../../molecules';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  // Override media queries injected by theme.mixins.toolbar
  '@media all': {
    height: HEADER_HEIGHT_WITHOUT_PADDING
  }
}));

export interface HeaderProps {
  wallet: WalletLedger;
}

export const Header: FC<HeaderProps> = ({ wallet: { name, publicAddress } }) => {
  const navigate = useNavigate();
  const setTimeout = useTimeout(2000);

  const [isCopied, setIsCopied] = useState(false);

  const truncatedAddress = useMemo(() => truncateAddress(publicAddress), [publicAddress]);

  const handleShare = useCallback(() => {
    copyToClipboard(publicAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false));
  }, [publicAddress, setTimeout]);

  const onWalletIconClick = useCallback(() => {
    navigate(LIST_WALLETS_PATH);
  }, [navigate]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <StyledToolbar>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <WalletIcon
                publicAddress={publicAddress}
                onClick={onWalletIconClick}
                isConnectedInformation
                size="sm"
              />
              <div>
                <Typography variant="body2" style={{ fontWeight: 500, lineHeight: 1.2 }}>
                  {truncateWalletName(name, 16)}
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" style={{ color: SECONDARY_GRAY }}>
                    {truncatedAddress}
                  </Typography>
                  <Tooltip title="Copy your address">
                    <IconButton
                      size="small"
                      edge="end"
                      color="inherit"
                      aria-label="Copy"
                      onClick={handleShare}
                      sx={{ padding: '2px', marginLeft: '2px' }}
                    >
                      {isCopied ? (
                        <DoneIcon sx={{ fontSize: '0.8rem' }} color="success" />
                      ) : (
                        <ContentCopyIcon sx={{ fontSize: '0.8rem' }} htmlColor={SECONDARY_GRAY} />
                      )}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>
            <NetworkIndicator />
          </div>
        </StyledToolbar>
      </AppBar>
    </Box>
  );
};
