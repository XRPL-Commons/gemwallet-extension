import { CSSProperties, FC, useMemo } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Button, Chip, Paper, Tooltip, Typography } from '@mui/material';

import { SECONDARY_GRAY } from '../../../constants';
import {
  CheckDisplayData,
  CheckStatus,
  formatCheckDate,
  truncateAddress
} from '../../../utils/fetchCheckData';

export interface CheckCardProps {
  check: CheckDisplayData;
  currentAddress: string;
  onCashClick?: (check: CheckDisplayData) => void;
  onCancelClick?: (check: CheckDisplayData) => void;
  style?: CSSProperties;
}

const STATUS_CONFIG: Record<
  CheckStatus,
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
  expired: {
    label: 'Expired',
    color: 'error',
    icon: <CancelIcon fontSize="small" />
  }
};

export const CheckCard: FC<CheckCardProps> = ({
  check,
  currentAddress,
  onCashClick,
  onCancelClick,
  style
}) => {
  const statusConfig = STATUS_CONFIG[check.status];

  const isOutgoing = check.Account === currentAddress;
  const counterpartyAddress = isOutgoing ? check.Destination : check.Account;
  const counterpartyLabel = isOutgoing ? 'To' : 'From';

  const displayAddress = useMemo(() => {
    return truncateAddress(counterpartyAddress);
  }, [counterpartyAddress]);

  const amountDisplay = useMemo(() => {
    if (check.currency === 'XRP') {
      return `${Number(check.formattedAmount).toLocaleString()} XRP`;
    }
    return `${Number(check.formattedAmount).toLocaleString()} ${check.currency}`;
  }, [check.formattedAmount, check.currency]);

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
          icon={<MonetizationOnIcon fontSize="small" />}
          label={isOutgoing ? 'Sent' : 'Received'}
          size="small"
          variant="outlined"
          color={isOutgoing ? 'warning' : 'primary'}
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* Amount */}
      <Typography variant="h6" style={{ marginBottom: '5px' }}>
        {amountDisplay}
      </Typography>

      {/* Counterparty */}
      <div style={{ marginBottom: '10px' }}>
        <Typography variant="body2" style={{ color: SECONDARY_GRAY }}>
          {counterpartyLabel}:{' '}
          <Tooltip title={counterpartyAddress} arrow>
            <span style={{ fontFamily: 'monospace' }}>{displayAddress}</span>
          </Tooltip>
        </Typography>
      </div>

      {/* Expiration date */}
      {check.expirationDate && (
        <div style={{ marginBottom: '10px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            <ScheduleIcon
              fontSize="inherit"
              style={{ verticalAlign: 'middle', marginRight: '4px' }}
            />
            Expires: {formatCheckDate(check.expirationDate)}
          </Typography>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {check.canCash && onCashClick && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<MonetizationOnIcon />}
            onClick={() => onCashClick(check)}
          >
            Cash
          </Button>
        )}
        {check.canCancel && onCancelClick && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CancelIcon />}
            onClick={() => onCancelClick(check)}
          >
            Cancel
          </Button>
        )}
      </div>
    </Paper>
  );
};
