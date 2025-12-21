import { CSSProperties, FC, useMemo } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Button, Chip, Paper, Tooltip, Typography } from '@mui/material';

import { SECONDARY_GRAY } from '../../../constants';
import {
  EscrowDisplayData,
  EscrowStatus,
  formatEscrowDate,
  truncateAddress
} from '../../../utils/fetchEscrowData';

export interface EscrowCardProps {
  escrow: EscrowDisplayData;
  currentAddress: string;
  onFinishClick?: (escrow: EscrowDisplayData) => void;
  onCancelClick?: (escrow: EscrowDisplayData) => void;
  style?: CSSProperties;
}

const STATUS_CONFIG: Record<
  EscrowStatus,
  {
    label: string;
    color: 'default' | 'primary' | 'success' | 'warning' | 'error';
    icon: JSX.Element;
  }
> = {
  pending: {
    label: 'Pending',
    color: 'default',
    icon: <ScheduleIcon fontSize="small" />
  },
  ready_to_finish: {
    label: 'Ready to Finish',
    color: 'success',
    icon: <LockOpenIcon fontSize="small" />
  },
  ready_to_cancel: {
    label: 'Ready to Cancel',
    color: 'warning',
    icon: <CancelIcon fontSize="small" />
  },
  conditional: {
    label: 'Conditional',
    color: 'primary',
    icon: <LockIcon fontSize="small" />
  },
  expired: {
    label: 'Expired',
    color: 'error',
    icon: <CancelIcon fontSize="small" />
  }
};

export const EscrowCard: FC<EscrowCardProps> = ({
  escrow,
  currentAddress,
  onFinishClick,
  onCancelClick,
  style
}) => {
  const statusConfig = STATUS_CONFIG[escrow.status];

  const isOutgoing = escrow.Account === currentAddress;
  const counterpartyAddress = isOutgoing ? escrow.Destination : escrow.Account;
  const counterpartyLabel = isOutgoing ? 'To' : 'From';

  const displayAddress = useMemo(() => {
    return truncateAddress(counterpartyAddress);
  }, [counterpartyAddress]);

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
        {escrow.Condition && (
          <Tooltip title="This escrow requires a cryptographic fulfillment" arrow>
            <Chip
              icon={<LockIcon fontSize="small" />}
              label="Has Condition"
              size="small"
              variant="outlined"
              style={{ marginLeft: '5px' }}
            />
          </Tooltip>
        )}
      </div>

      {/* Amount */}
      <Typography variant="h6" style={{ marginBottom: '5px' }}>
        {escrow.formattedAmount.toLocaleString()} XRP
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

      {/* Dates */}
      <div style={{ marginBottom: '10px' }}>
        {escrow.finishAfterDate && (
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            <ScheduleIcon
              fontSize="inherit"
              style={{ verticalAlign: 'middle', marginRight: '4px' }}
            />
            Finish after: {formatEscrowDate(escrow.finishAfterDate)}
          </Typography>
        )}
        {escrow.cancelAfterDate && (
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontSize: '0.85rem' }}>
            <CancelIcon
              fontSize="inherit"
              style={{ verticalAlign: 'middle', marginRight: '4px' }}
            />
            Cancel after: {formatEscrowDate(escrow.cancelAfterDate)}
          </Typography>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {escrow.canFinish && onFinishClick && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => onFinishClick(escrow)}
          >
            Finish
          </Button>
        )}
        {escrow.canCancel && onCancelClick && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CancelIcon />}
            onClick={() => onCancelClick(escrow)}
          >
            Cancel
          </Button>
        )}
      </div>
    </Paper>
  );
};
