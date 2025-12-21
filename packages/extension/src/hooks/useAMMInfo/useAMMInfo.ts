import { useCallback, useEffect, useState } from 'react';

import { AMMInfoRequest, AMMInfoResponse, Currency } from 'xrpl';

import { useNetwork } from '../../contexts';

export interface AMMPoolInfo {
  amount: string;
  amount2: string;
  lpToken: {
    currency: string;
    issuer: string;
    value: string;
  };
  tradingFee: number;
  auctionSlot?: {
    account: string;
    discountedFee: number;
    expiration: string;
    price: {
      currency: string;
      issuer: string;
      value: string;
    };
  };
  voteSlots?: Array<{
    account: string;
    tradingFee: number;
    voteWeight: number;
  }>;
}

interface UseAMMInfoResult {
  ammInfo: AMMPoolInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const formatAmount = (
  amount: string | { currency: string; issuer?: string; value: string }
): string => {
  if (typeof amount === 'string') {
    // XRP in drops, convert to XRP
    return `${(Number(amount) / 1_000_000).toFixed(6)} XRP`;
  }
  return `${amount.value} ${amount.currency}`;
};

export const useAMMInfo = (asset: Currency | null, asset2: Currency | null): UseAMMInfoResult => {
  const { client } = useNetwork();
  const [ammInfo, setAmmInfo] = useState<AMMPoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAMMInfo = useCallback(async () => {
    if (!client || !asset || !asset2) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: AMMInfoResponse = await client.request<AMMInfoRequest>({
        command: 'amm_info',
        asset,
        asset2
      } as AMMInfoRequest);

      const amm = response.result.amm;

      const poolInfo: AMMPoolInfo = {
        amount: formatAmount(amm.amount),
        amount2: formatAmount(amm.amount2),
        lpToken:
          typeof amm.lp_token === 'string'
            ? { currency: 'XRP', issuer: '', value: amm.lp_token }
            : amm.lp_token,
        tradingFee: amm.trading_fee,
        auctionSlot: amm.auction_slot
          ? {
              account: amm.auction_slot.account,
              discountedFee: amm.auction_slot.discounted_fee,
              expiration: amm.auction_slot.expiration,
              price: amm.auction_slot.price
            }
          : undefined,
        voteSlots: amm.vote_slots?.map(
          (slot: { account: string; trading_fee: number; vote_weight: number }) => ({
            account: slot.account,
            tradingFee: slot.trading_fee,
            voteWeight: slot.vote_weight
          })
        )
      };

      setAmmInfo(poolInfo);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch AMM info';
      setError(errorMessage);
      setAmmInfo(null);
    } finally {
      setLoading(false);
    }
  }, [client, asset, asset2]);

  useEffect(() => {
    fetchAMMInfo();
  }, [fetchAMMInfo]);

  return {
    ammInfo,
    loading,
    error,
    refetch: fetchAMMInfo
  };
};
