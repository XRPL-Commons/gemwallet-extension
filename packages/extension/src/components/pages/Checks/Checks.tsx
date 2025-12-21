import { FC } from 'react';

import { useNavigate } from 'react-router-dom';

import { WELCOME_PATH } from '../../../constants';
import { useWallet } from '../../../contexts';
import { CheckListing } from '../../organisms';
import { PageWithHeader, PageWithSpinner } from '../../templates';

export const Checks: FC = () => {
  const navigate = useNavigate();
  const { wallets, selectedWallet } = useWallet();

  if (wallets.length === 0) {
    navigate(WELCOME_PATH);
    return <PageWithSpinner />;
  }

  return (
    <PageWithHeader>
      <CheckListing address={wallets?.[selectedWallet]?.publicAddress} />
    </PageWithHeader>
  );
};
