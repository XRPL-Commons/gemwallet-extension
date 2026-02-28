import { FC } from 'react';

import ErrorIcon from '@mui/icons-material/Error';
import { Typography } from '@mui/material';

import { useGemTokens } from '../../../hooks';

export interface InsufficientFundsWarningProps {
  hasEnoughFunds?: boolean;
}

export const InsufficientFundsWarning: FC<InsufficientFundsWarningProps> = ({ hasEnoughFunds }) => {
  const tokens = useGemTokens();

  if (hasEnoughFunds === false) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '10px'
        }}
      >
        <ErrorIcon style={{ color: tokens.action.danger }} />
        <Typography variant="body1" style={{ marginLeft: '10px', color: tokens.action.danger }}>
          Insufficient funds.
        </Typography>
      </div>
    );
  }

  return null;
};
