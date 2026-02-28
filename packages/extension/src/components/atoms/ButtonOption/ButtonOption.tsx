import { FC } from 'react';

import { Check as CheckIcon } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';

import { useGemTokens } from '../../../hooks';

export interface ButtonOptionProps {
  name: string;
  description: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const ButtonOption: FC<ButtonOptionProps> = ({
  name,
  description,
  isSelected = false,
  onClick
}) => {
  const tokens = useGemTokens();

  return (
    <Card
      style={{
        marginBottom: '20px'
      }}
      onClick={onClick}
    >
      <CardActionArea>
        <CardContent
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'initial',
            border: `solid ${isSelected ? tokens.text.primary : tokens.text.secondary}`
          }}
        >
          <Box>
            <Typography gutterBottom>{name}</Typography>
            <Typography variant="subtitle2" color={tokens.text.secondary}>
              {description}
            </Typography>
          </Box>
          {isSelected ? <CheckIcon /> : null}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
