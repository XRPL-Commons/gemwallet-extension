import { FC, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { WELCOME_PATH } from '../../../constants';
import { useWallet } from '../../../contexts';
import { EscrowListing } from '../../organisms';
import { PageWithReturn, PageWithSpinner } from '../../templates';

export const Escrow: FC = () => {
  const navigate = useNavigate();
  const { wallets, selectedWallet } = useWallet();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (wallets.length === 0) {
    navigate(WELCOME_PATH);
    return <PageWithSpinner />;
  }

  return (
    <PageWithReturn title="Escrow" onBackClick={handleBack}>
      <EscrowListing address={wallets?.[selectedWallet]?.publicAddress} />
    </PageWithReturn>
  );
};
