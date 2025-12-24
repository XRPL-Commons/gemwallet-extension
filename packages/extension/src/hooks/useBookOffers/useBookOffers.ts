import { useCallback, useEffect, useState } from 'react';

import { useNetwork } from '../../contexts';
import { BookOffer, BookOffersResult, SwapToken } from '../../types/swap.types';

interface BookOfferCurrency {
  currency: string;
  issuer?: string;
}

interface UseBookOffersParams {
  takerPays: SwapToken | null; // What we pay (input token)
  takerGets: SwapToken | null; // What we get (output token)
  limit?: number;
}

interface UseBookOffersResult {
  offers: BookOffer[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch order book offers from the XRPL DEX.
 * Returns offers where makers are selling takerGets for takerPays.
 */
export const useBookOffers = ({
  takerPays,
  takerGets,
  limit = 200
}: UseBookOffersParams): UseBookOffersResult => {
  const { client } = useNetwork();
  const [offers, setOffers] = useState<BookOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildCurrency = useCallback((token: SwapToken): BookOfferCurrency => {
    if (token.currency === 'XRP') {
      return { currency: 'XRP' };
    }
    return {
      currency: token.currency,
      issuer: token.issuer!
    };
  }, []);

  const fetchBookOffers = useCallback(async () => {
    if (!client || !takerPays || !takerGets) {
      return;
    }

    // Don't fetch if tokens are the same
    if (
      takerPays.currency === takerGets.currency &&
      (takerPays.issuer || '') === (takerGets.issuer || '')
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.request({
        command: 'book_offers',
        taker_pays: buildCurrency(takerPays),
        taker_gets: buildCurrency(takerGets),
        limit
      });

      const result = response.result as BookOffersResult;
      setOffers(result.offers || []);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch order book';

      // Check for specific errors
      if (errorMessage.includes('badMarket')) {
        setError('No market exists for this token pair');
      } else {
        setError(errorMessage);
      }
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [client, takerPays, takerGets, limit, buildCurrency]);

  useEffect(() => {
    fetchBookOffers();
  }, [fetchBookOffers]);

  return {
    offers,
    loading,
    error,
    refetch: fetchBookOffers
  };
};
