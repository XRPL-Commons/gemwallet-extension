import { FC } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button, Container, Grid, Typography } from '@mui/material';

import { useGemTokens } from '../../../hooks';

const BUTTONS_WIDTH = '150px';

export interface ActionButtonsProps {
  onClickApprove: () => void;
  onClickReject: () => void;
  headerText?: string;
  isApproveEnabled?: boolean;
  approveButtonText?: string;
  rejectButtonText?: string;
  navigation?: NavigationProps;
}

export interface NavigationProps {
  isNavigationEnabled?: boolean;
  isNavigationPreviousEnabled?: boolean;
  isNavigationNextEnabled?: boolean;
  onNavigationPrevious?: () => void;
  onNavigationNext?: () => void;
}

export const ActionButtons: FC<ActionButtonsProps> = ({
  onClickApprove,
  onClickReject,
  headerText,
  isApproveEnabled = true,
  approveButtonText = 'Sign',
  rejectButtonText = 'Reject',
  navigation
}) => {
  const tokens = useGemTokens();

  const buttonStyle = {
    minWidth: navigation?.isNavigationEnabled ? undefined : BUTTONS_WIDTH,
    height: headerText ? undefined : '42px'
  };

  return (
    <div
      style={{
        backgroundColor: tokens.nav.background,
        position: 'fixed',
        width: '100%',
        bottom: 0,
        paddingTop: '10px',
        paddingBottom: '10px',
        boxShadow: tokens.nav.shadow
      }}
    >
      {headerText ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            color: tokens.text.secondary,
            paddingBottom: '10px'
          }}
        >
          <Typography variant="body2" align="center">
            {headerText}
          </Typography>
        </div>
      ) : null}
      <Container>
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              onClick={onClickReject}
              style={buttonStyle}
            >
              {rejectButtonText}
            </Button>
          </Grid>
          {navigation?.isNavigationEnabled ? (
            <Grid item>
              <Button
                style={{ ...buttonStyle, minWidth: '0' }}
                disabled={!navigation?.isNavigationPreviousEnabled}
                onClick={navigation?.onNavigationPrevious}
                startIcon={<ArrowBackIcon />}
              />
              <Button
                style={{ ...buttonStyle, minWidth: '0' }}
                disabled={!navigation?.isNavigationNextEnabled}
                onClick={navigation?.onNavigationNext}
                endIcon={<ArrowForwardIcon />}
              />
            </Grid>
          ) : null}
          <Grid item>
            <Button
              variant="contained"
              onClick={onClickApprove}
              style={buttonStyle}
              disabled={!isApproveEnabled}
            >
              {approveButtonText}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};
