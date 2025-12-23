import { useCallback, useEffect, useState } from 'react';

import * as Sentry from '@sentry/react';

import { getPopularTokens } from '../../constants';
import { useNetwork, useWallet } from '../../contexts';
import { SwapToken } from '../../types/swap.types';
import { getTrustLineData } from '../../utils';

interface UseSwapTokensResult {
  tokens: SwapToken[];
  popularTokens: SwapToken[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch user's tokens and combine with popular tokens.
 * Returns both lists for the token selector.
 */
export const useSwapTokens = (): UseSwapTokensResult => {
  const { client, networkName } = useNetwork();
  const { getCurrentWallet } = useWallet();
  const [tokens, setTokens] = useState<SwapToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get popular tokens based on network
  const popularTokens = getPopularTokens(networkName);

  const fetchTokens = useCallback(async () => {
    const wallet = getCurrentWallet();
    if (!client || !wallet?.publicAddress) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user's token balances
      const balances = await client.getBalances(wallet.publicAddress);

      // Convert balances to SwapToken format
      const userTokens: SwapToken[] = await Promise.all(
        balances.map(async (balance) => {
          const token: SwapToken = {
            currency: balance.currency,
            issuer: balance.issuer,
            value: balance.value
          };

          // Try to fetch token metadata
          if (balance.issuer) {
            try {
              const metadata = await getTrustLineData({
                token: balance.currency,
                issuer: balance.issuer
              });
              token.name = metadata.tokenName || undefined;
              token.icon = metadata.tokenIconUrl || undefined;
            } catch {
              // Metadata fetch failed, continue without it
            }
          } else {
            // Native XRP
            token.name = 'XRP';
          }

          return token;
        })
      );

      setTokens(userTokens);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch tokens';
      setError(errorMessage);
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  }, [client, getCurrentWallet]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    popularTokens,
    loading,
    error,
    refetch: fetchTokens
  };
};
