import { FC } from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Card, CardContent, CircularProgress, IconButton, Typography } from '@mui/material';

import { AMMPoolInfo as PoolInfoType } from '../../../hooks/useAMMInfo/useAMMInfo';

interface AMMPoolInfoProps {
  ammInfo: PoolInfoType | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const AMMPoolInfo: FC<AMMPoolInfoProps> = ({ ammInfo, loading, error, onRefresh }) => {
  if (loading) {
    return (
      <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <CardContent
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading pool info...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
            <IconButton size="small" onClick={onRefresh} title="Retry">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!ammInfo) {
    return null;
  }

  const tradingFeePercent = (ammInfo.tradingFee / 1000).toFixed(3);

  return (
    <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="primary">
            AMM Pool Info
          </Typography>
          <IconButton size="small" onClick={onRefresh} title="Refresh">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Pool Asset 1:
            </Typography>
            <Typography variant="body2">{ammInfo.amount}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Pool Asset 2:
            </Typography>
            <Typography variant="body2">{ammInfo.amount2}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              LP Token:
            </Typography>
            <Typography variant="body2">
              {ammInfo.lpToken.value}{' '}
              {ammInfo.lpToken.currency.length > 10
                ? `${ammInfo.lpToken.currency.slice(0, 10)}...`
                : ammInfo.lpToken.currency}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Trading Fee:
            </Typography>
            <Typography variant="body2">{tradingFeePercent}%</Typography>
          </Box>

          {ammInfo.auctionSlot && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="caption" color="text.secondary">
                Auction Slot Holder
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {ammInfo.auctionSlot.account}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Discounted Fee: {(ammInfo.auctionSlot.discountedFee / 1000).toFixed(3)}%
              </Typography>
            </Box>
          )}

          {ammInfo.voteSlots && ammInfo.voteSlots.length > 0 && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="caption" color="text.secondary">
                Active Voters: {ammInfo.voteSlots.length}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
