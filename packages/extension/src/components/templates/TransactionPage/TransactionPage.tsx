import { FC } from 'react';

import { Container } from '@mui/material';

import { NETWORK_BANNER_HEIGHT } from '../../../constants';
import { useNetwork } from '../../../contexts';
import { useGemTokens } from '../../../hooks';
import { TransactionTextDescription } from '../../atoms';
import {
  ActionButtons,
  InsufficientFundsWarning,
  NavigationProps,
  TransactionHeader
} from '../../molecules';

export interface TransactionPageProps {
  title: string;
  description?: string | string[];
  url?: string | null;
  favicon?: string;
  actionButtonsDescription?: string;
  approveButtonText?: string;
  hasEnoughFunds?: boolean;
  onClickApprove: () => void;
  onClickReject: () => void;
  navigation?: NavigationProps;
  children: React.ReactNode;
}

export const TransactionPage: FC<TransactionPageProps> = ({
  title,
  description,
  url,
  favicon,
  actionButtonsDescription,
  approveButtonText,
  hasEnoughFunds,
  onClickApprove,
  onClickReject,
  navigation,
  children
}) => {
  const { hasOfflineBanner } = useNetwork();
  const tokens = useGemTokens();

  return (
    <>
      <Container
        component="main"
        style={{
          ...(hasOfflineBanner ? { position: 'fixed', top: NETWORK_BANNER_HEIGHT } : {}),
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '24px',
          paddingLeft: '18px',
          paddingRight: '18px',
          overflowY: 'auto',
          height: 'auto',
          paddingBottom: '100px',
          backgroundColor: tokens.background.default,
          backgroundImage: `linear-gradient(${tokens.surface.hover}, ${tokens.surface.hover})`
        }}
      >
        <TransactionHeader title={title} favicon={favicon} url={url} />
        {description ? <TransactionTextDescription text={description} /> : null}
        <InsufficientFundsWarning hasEnoughFunds={hasEnoughFunds} />
        {children}
      </Container>
      <ActionButtons
        onClickReject={onClickReject}
        onClickApprove={onClickApprove}
        headerText={actionButtonsDescription}
        approveButtonText={approveButtonText}
        isApproveEnabled={hasEnoughFunds !== false}
        navigation={navigation}
      />
    </>
  );
};
