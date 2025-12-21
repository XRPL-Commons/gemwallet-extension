import { CSSProperties, FC, useMemo } from 'react';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Button, Chip, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';

import { SECONDARY_GRAY } from '../../../constants';
import {
  PaymentChannelDisplayData,
  PaymentChannelStatus,
  formatChannelDate,
  getClaimedPercentage,
  truncateAddress
} from '../../../utils/fetchPaymentChannelData';

export interface PaymentChannelCardProps {
  channel: PaymentChannelDisplayData;
  currentAddress: string;
  onFundClick?: (channel: PaymentChannelDisplayData) => void;
  onClaimClick?: (channel: PaymentChannelDisplayData) => void;
  style?: CSSProperties;
}

const STATUS_CONFIG: Record<
  PaymentChannelStatus,
  {
    label: string;
    color: 'default' | 'primary' | 'success' | 'warning' | 'error';
    icon: JSX.Element;
  }
> = {
  active: {
    label: 'Active',
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />
  },
  expiring: {
    label: 'Closing',
    color: 'warning',
    icon: <HourglassEmptyIcon fontSize="small" />
  },
  expired: {
    label: 'Expired',
    color: 'error',
    icon: <CancelIcon fontSize="small" />
  }
};

export const PaymentChannelCard: FC<PaymentChannelCardProps> = ({
  channel,
  currentAddress,
  onFundClick,
  onClaimClick,
  style
}) => {
  const statusConfig = STATUS_CONFIG[channel.status];

  const isSource = channel.Account === currentAddress;
  const counterpartyAddress = isSource ? channel.Destination : channel.Account;
  const counterpartyLabel = isSource ? 'To' : 'From';

  const displayAddress = useMemo(() => {
    return truncateAddress(counterpartyAddress);
  }, [counterpartyAddress]);

  const claimedPercentage = useMemo(() => {
    return getClaimedPercentage(channel);
  }, [channel]);

  return (
    <Paper
      elevation={5}
      style={{
        padding: '15px',
        marginBottom: '10px',
        ...style
      }}
    >
      {/* Status chip */}
      <div style={{ marginBottom: '10px' }}>
        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          variant="outlined"
        />
        <Chip
          icon={<AccountBalanceWalletIcon fontSize="small" />}
          label={isSource ? 'Outgoing' : 'Incoming'}
          size="small"
          variant="outlined"
          color={isSource ? 'warning' : 'primary'}
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* Amount and Balance */}
      <Typography variant="h6" style={{ marginBottom: '5px' }}>
        {Number(channel.formattedAmount).toLocaleString()} XRP
      </Typography>

      {/* Progress bar showing claimed amount */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            Claimed: {Number(channel.formattedBalance).toLocaleString()} XRP
          </Typography>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            {claimedPercentage.toFixed(1)}%
          </Typography>
        </div>
        <LinearProgress
          variant="determinate"
          value={claimedPercentage}
          style={{ height: '8px', borderRadius: '4px' }}
        />
        <Typography
          variant="body2"
          style={{ color: SECONDARY_GRAY, fontSize: '0.75rem', marginTop: '4px' }}
        >
          Remaining: {Number(channel.remainingAmount).toLocaleString()} XRP
        </Typography>
      </div>

      {/* Counterparty */}
      <div style={{ marginBottom: '10px' }}>
        <Typography variant="body2" style={{ color: SECONDARY_GRAY }}>
          {counterpartyLabel}:{' '}
          <Tooltip title={counterpartyAddress} arrow>
            <span style={{ fontFamily: 'monospace' }}>{displayAddress}</span>
          </Tooltip>
        </Typography>
      </div>

      {/* Settle delay */}
      <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
        Settle Delay: {channel.SettleDelay} seconds
      </Typography>

      {/* Expiration date */}
      {channel.expirationDate && (
        <div style={{ marginTop: '5px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            <ScheduleIcon
              fontSize="inherit"
              style={{ verticalAlign: 'middle', marginRight: '4px' }}
            />
            Closes: {formatChannelDate(channel.expirationDate)}
          </Typography>
        </div>
      )}

      {/* Cancel after date */}
      {channel.cancelAfterDate && (
        <div style={{ marginTop: '5px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            <CancelIcon
              fontSize="inherit"
              style={{ verticalAlign: 'middle', marginRight: '4px' }}
            />
            Cancel After: {formatChannelDate(channel.cancelAfterDate)}
          </Typography>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        {channel.canFund && onFundClick && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onFundClick(channel)}
          >
            Fund
          </Button>
        )}
        {channel.canClaim && onClaimClick && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<MonetizationOnIcon />}
            onClick={() => onClaimClick(channel)}
          >
            Claim
          </Button>
        )}
      </div>
    </Paper>
  );
};
