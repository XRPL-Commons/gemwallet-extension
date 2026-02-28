import { FC } from 'react';

import { Typography } from '@mui/material';

import { useGemTokens } from '../../../hooks';

export interface TransactionTextDescriptionProps {
  text: string | string[];
}

export const TransactionTextDescription: FC<TransactionTextDescriptionProps> = ({ text }) => {
  const tokens = useGemTokens();

  if (typeof text === 'string') {
    return (
      <Typography style={{ color: tokens.text.secondary, marginTop: '20px' }}>{text}</Typography>
    );
  }

  return (
    <>
      {text.map((paragraph, index) => (
        <Typography
          key={index}
          style={{ color: tokens.text.secondary, marginTop: index === 0 ? '20px' : '5px' }}
        >
          {paragraph}
        </Typography>
      ))}
    </>
  );
};
