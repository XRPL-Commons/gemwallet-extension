import { useCallback, useEffect, useState } from 'react';

import { AMMInfoRequest, AMMInfoResponse, Currency } from 'xrpl';

import { DEFAULT_SLIPPAGE, SWAP_FEE_PERCENTAGE } from '../../constants';
import { useNetwork } from '../../contexts';
import { AMMQuote, DEXQuote, SwapQuote, SwapRoute, SwapToken } from '../../types/swap.types';
import {
  aggregateBookOffers,
  calculateAMMOutput,
  calculateMinimumReceived,
  calculatePriceImpact,
  calculateSwapFee
} from '../../utils/swap';
import { useBookOffers } from '../useBookOffers';

interface UseSwapQuoteParams {
  fromToken: SwapToken | null;
  toToken: SwapToken | null;
  amount: string;
  slippage?: number;
}

interface UseSwapQuoteResult {
  quote: SwapQuote | null;
  ammQuote: AMMQuote | null;
  dexQuote: DEXQuote | null;
  bestRoute: SwapRoute | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and compare swap quotes from AMM and DEX.
 * Returns the best quote along with individual AMM and DEX quotes.
 */
export const useSwapQuote = ({
  fromToken,
  toToken,
  amount,
  slippage = DEFAULT_SLIPPAGE
}: UseSwapQuoteParams): UseSwapQuoteResult => {
  const { client } = useNetwork();
  const [ammQuote, setAmmQuote] = useState<AMMQuote | null>(null);
  const [ammLoading, setAmmLoading] = useState(false);
  const [ammError, setAmmError] = useState<string | null>(null);

  // Fetch DEX quotes using the book offers hook
  const {
    offers,
    loading: dexLoading,
    error: dexError,
    refetch: refetchDex
  } = useBookOffers({
    takerPays: fromToken,
    takerGets: toToken
  });

  // Calculate DEX quote from offers
  const dexQuote: DEXQuote | null =
    offers.length > 0 && amount && parseFloat(amount) > 0
      ? (() => {
          const result = aggregateBookOffers(offers, amount);
          return {
            offersAvailable: true,
            expectedOutput: result.outputAmount,
            fillPercentage: result.fillPercentage,
            priceImpact: result.priceImpact
          };
        })()
      : offers.length === 0 && !dexLoading && !dexError
        ? {
            offersAvailable: false,
            expectedOutput: '0',
            fillPercentage: 0,
            priceImpact: 0
          }
        : null;

  const buildCurrency = useCallback((token: SwapToken): Currency => {
    if (token.currency === 'XRP') {
      return { currency: 'XRP' };
    }
    return {
      currency: token.currency,
      issuer: token.issuer!
    };
  }, []);

  const fetchAMMQuote = useCallback(async () => {
    if (!client || !fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      setAmmQuote(null);
      return;
    }

    // Don't fetch if tokens are the same
    if (
      fromToken.currency === toToken.currency &&
      (fromToken.issuer || '') === (toToken.issuer || '')
    ) {
      setAmmQuote(null);
      return;
    }

    setAmmLoading(true);
    setAmmError(null);

    try {
      const asset = buildCurrency(fromToken);
      const asset2 = buildCurrency(toToken);

      const response: AMMInfoResponse = await client.request<AMMInfoRequest>({
        command: 'amm_info',
        asset,
        asset2
      } as AMMInfoRequest);

      const amm = response.result.amm;

      // Parse pool amounts
      const poolAmount1 =
        typeof amm.amount === 'string'
          ? parseFloat(amm.amount) / 1_000_000 // XRP in drops
          : parseFloat(amm.amount.value);

      const poolAmount2 =
        typeof amm.amount2 === 'string'
          ? parseFloat(amm.amount2) / 1_000_000
          : parseFloat(amm.amount2.value);

      // Determine which pool amount corresponds to which token
      // amm.amount corresponds to asset, amm.amount2 corresponds to asset2
      const inputAmount = parseFloat(amount);
      const tradingFee = amm.trading_fee;

      // Calculate expected output using AMM formula
      const expectedOutput = calculateAMMOutput(inputAmount, poolAmount1, poolAmount2, tradingFee);

      // Calculate price impact
      const priceImpact = calculatePriceImpact(
        inputAmount,
        expectedOutput,
        poolAmount1,
        poolAmount2
      );

      setAmmQuote({
        poolExists: true,
        poolAmount1: poolAmount1.toString(),
        poolAmount2: poolAmount2.toString(),
        tradingFee,
        expectedOutput: expectedOutput.toString(),
        priceImpact
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch AMM info';

      // Check for specific errors indicating no AMM pool exists
      if (
        errorMessage.includes('actNotFound') ||
        errorMessage.includes('entryNotFound') ||
        errorMessage.includes('ammNotFound')
      ) {
        setAmmQuote({
          poolExists: false,
          poolAmount1: '0',
          poolAmount2: '0',
          tradingFee: 0,
          expectedOutput: '0',
          priceImpact: 0
        });
      } else {
        setAmmError(errorMessage);
        setAmmQuote(null);
      }
    } finally {
      setAmmLoading(false);
    }
  }, [client, fromToken, toToken, amount, buildCurrency]);

  useEffect(() => {
    fetchAMMQuote();
  }, [fetchAMMQuote]);

  const refetch = useCallback(() => {
    fetchAMMQuote();
    refetchDex();
  }, [fetchAMMQuote, refetchDex]);

  // Determine best quote
  const getBestQuote = useCallback((): {
    quote: SwapQuote | null;
    bestRoute: SwapRoute | null;
  } => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      return { quote: null, bestRoute: null };
    }

    const ammOutput = ammQuote?.poolExists ? parseFloat(ammQuote.expectedOutput) : 0;
    const dexOutput =
      dexQuote?.offersAvailable && dexQuote.fillPercentage >= 0.99
        ? parseFloat(dexQuote.expectedOutput)
        : 0;

    // No viable route
    if (ammOutput <= 0 && dexOutput <= 0) {
      // Check if we have a partial DEX fill
      if (dexQuote?.offersAvailable && dexQuote.fillPercentage > 0) {
        // Use DEX even with partial fill, but warn user
        const expectedOutput = dexQuote.expectedOutput;
        const fee = calculateSwapFee(expectedOutput, toToken);
        const outputAfterFee = (parseFloat(expectedOutput) * (1 - SWAP_FEE_PERCENTAGE)).toString();
        const minimumReceived = calculateMinimumReceived(outputAfterFee, slippage);

        return {
          quote: {
            sourceAmount: amount,
            destinationAmount: expectedOutput,
            rate: parseFloat(expectedOutput) / parseFloat(amount),
            priceImpact: dexQuote.priceImpact,
            route: 'DEX',
            fee,
            minimumReceived,
            dexQuote
          },
          bestRoute: 'DEX'
        };
      }

      return { quote: null, bestRoute: null };
    }

    // Determine best route based on output
    const bestRoute: SwapRoute = ammOutput >= dexOutput ? 'AMM' : 'DEX';
    const expectedOutput =
      bestRoute === 'AMM' ? ammQuote!.expectedOutput : dexQuote!.expectedOutput;
    const priceImpact = bestRoute === 'AMM' ? ammQuote!.priceImpact : dexQuote?.priceImpact || 0;

    // Calculate fee on output
    const fee = calculateSwapFee(expectedOutput, toToken);

    // Calculate minimum received (after slippage, before fee)
    const outputAfterFee = (parseFloat(expectedOutput) * (1 - SWAP_FEE_PERCENTAGE)).toString();
    const minimumReceived = calculateMinimumReceived(outputAfterFee, slippage);

    const quote: SwapQuote = {
      sourceAmount: amount,
      destinationAmount: expectedOutput,
      rate: parseFloat(expectedOutput) / parseFloat(amount),
      priceImpact,
      route: bestRoute,
      fee,
      minimumReceived,
      ammQuote: ammQuote || undefined,
      dexQuote: dexQuote || undefined
    };

    return { quote, bestRoute };
  }, [fromToken, toToken, amount, ammQuote, dexQuote, slippage]);

  const { quote, bestRoute } = getBestQuote();

  // Determine combined loading state
  const loading = ammLoading || dexLoading;

  // Determine error state (only error if both failed)
  const error =
    ammError && dexError
      ? 'Failed to fetch quotes from both AMM and DEX'
      : ammError && !dexQuote?.offersAvailable && !ammQuote?.poolExists
        ? ammError
        : dexError && !ammQuote?.poolExists
          ? dexError
          : null;

  return {
    quote,
    ammQuote,
    dexQuote,
    bestRoute,
    loading,
    error,
    refetch
  };
};
