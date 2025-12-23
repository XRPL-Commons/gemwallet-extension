import { FC, useCallback, useEffect, useState } from 'react';

import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import { AccountNFTokenResponse } from '@gemwallet/constants';

import { useLedger } from '../../../contexts';
import { NFTListing } from '../../organisms';
import { PageWithReturn } from '../../templates';

export const MAX_FETCHED_NFTS = 20;

const initialState = {
  account_nfts: [],
  marker: null,
  isLoading: false
};

interface NFTsProps extends AccountNFTokenResponse {
  isLoading: boolean;
}

export const NFTViewer: FC = () => {
  const navigate = useNavigate();
  const { getNFTs } = useLedger();
  const [NFTs, setNFTs] = useState<NFTsProps>(initialState);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const fetchNFTs = useCallback(async () => {
    try {
      const payload = {
        limit: MAX_FETCHED_NFTS,
        marker: NFTs.marker ?? undefined
      };

      setNFTs({ ...NFTs, isLoading: true });

      const response = await getNFTs(payload);

      setNFTs({
        marker: response.marker,
        account_nfts: NFTs.account_nfts.concat(response.account_nfts),
        isLoading: false
      });
    } catch (error) {
      setNFTs(initialState);
      Sentry.captureException(error);
    }
  }, [NFTs, getNFTs]);

  useEffect(() => {
    fetchNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to fetch once
  }, []);

  return (
    <PageWithReturn title="NFTs" onBackClick={handleBack}>
      <NFTListing
        {...{
          ...NFTs,
          onLoadMoreClick: fetchNFTs
        }}
      />
    </PageWithReturn>
  );
};
