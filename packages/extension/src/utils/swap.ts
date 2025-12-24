import { Amount, OfferCreate, Payment } from 'xrpl';

import {
  BATCH_FLAGS,
  OFFER_CREATE_FLAGS,
  PAYMENT_FLAGS,
  SWAP_FEE_PERCENTAGE,
  TF_INNER_BATCH_TXN,
  USE_BATCH_TRANSACTIONS
} from '../constants';
import {
  AMMSwapParams,
  BatchTransactionParams,
  BookOffer,
  DEXSwapParams,
  FeePaymentParams,
  SwapFee,
  SwapToken
} from '../types/swap.types';

/**
 * Calculate the output amount from an AMM swap using the constant product formula.
 * Formula: outputAmount = (poolOutput * inputAmount * (1 - tradingFee)) / (poolInput + inputAmount * (1 - tradingFee))
 *
 * @param inputAmount - The amount of input token
 * @param poolInputReserve - The pool's reserve of the input token
 * @param poolOutputReserve - The pool's reserve of the output token
 * @param tradingFee - The AMM trading fee (in basis points, e.g., 500 = 0.5%)
 * @returns The expected output amount
 */
export const calculateAMMOutput = (
  inputAmount: number,
  poolInputReserve: number,
  poolOutputReserve: number,
  tradingFee: number
): number => {
  // Trading fee is in basis points (1/100,000), convert to decimal
  const feeDecimal = tradingFee / 100000;
  const inputWithFee = inputAmount * (1 - feeDecimal);

  // Constant product formula: x * y = k
  // New pool input: poolInput + inputWithFee
  // New pool output: k / (poolInput + inputWithFee)
  // Output amount: poolOutput - newPoolOutput
  const outputAmount = (poolOutputReserve * inputWithFee) / (poolInputReserve + inputWithFee);

  return outputAmount;
};

/**
 * Calculate the price impact of a swap.
 * Price impact = 1 - (actual rate / market rate)
 *
 * @param inputAmount - The input amount
 * @param outputAmount - The expected output amount
 * @param poolInputReserve - The pool's input token reserve
 * @param poolOutputReserve - The pool's output token reserve
 * @returns The price impact as a decimal (0.05 = 5%)
 */
export const calculatePriceImpact = (
  inputAmount: number,
  outputAmount: number,
  poolInputReserve: number,
  poolOutputReserve: number
): number => {
  // Market rate before the trade
  const marketRate = poolOutputReserve / poolInputReserve;
  // Actual rate from the trade
  const actualRate = outputAmount / inputAmount;
  // Price impact
  const priceImpact = 1 - actualRate / marketRate;

  return Math.max(0, priceImpact);
};

/**
 * Calculate the minimum received amount after slippage.
 *
 * @param expectedOutput - The expected output amount
 * @param slippage - The slippage tolerance as a decimal (0.01 = 1%)
 * @returns The minimum received amount as a string
 */
export const calculateMinimumReceived = (expectedOutput: string, slippage: number): string => {
  const output = parseFloat(expectedOutput);
  const minReceived = output * (1 - slippage);
  return minReceived.toString();
};

/**
 * Calculate the swap fee (percentage of output).
 *
 * @param outputAmount - The output amount
 * @param token - The output token
 * @param feePercentage - The fee percentage as a decimal (default: 0.001 = 0.1%)
 * @returns The swap fee details
 */
export const calculateSwapFee = (
  outputAmount: string,
  token: SwapToken,
  feePercentage: number = SWAP_FEE_PERCENTAGE
): SwapFee => {
  const output = parseFloat(outputAmount);
  const feeAmount = output * feePercentage;

  return {
    amount: feeAmount.toString(),
    currency: token.currency,
    issuer: token.issuer
  };
};

/**
 * Aggregate book offers to calculate the expected output for a given input amount.
 *
 * @param offers - Array of book offers from book_offers RPC
 * @param inputAmount - The input amount to swap
 * @returns Object with expected output and fill percentage
 */
export const aggregateBookOffers = (
  offers: BookOffer[],
  inputAmount: string
): { outputAmount: string; fillPercentage: number; priceImpact: number } => {
  let remainingInput = parseFloat(inputAmount);
  let totalOutput = 0;
  let totalInputUsed = 0;

  // Sort offers by quality (best price first)
  const sortedOffers = [...offers].sort((a, b) => {
    const qualityA = parseFloat(a.quality || '0');
    const qualityB = parseFloat(b.quality || '0');
    return qualityA - qualityB;
  });

  for (const offer of sortedOffers) {
    if (remainingInput <= 0) break;

    // TakerPays is what we pay (input), TakerGets is what we get (output)
    const offerInput =
      typeof offer.TakerPays === 'string'
        ? parseFloat(offer.TakerPays) / 1_000_000 // XRP in drops
        : parseFloat(offer.TakerPays.value);

    const offerOutput =
      typeof offer.TakerGets === 'string'
        ? parseFloat(offer.TakerGets) / 1_000_000 // XRP in drops
        : parseFloat(offer.TakerGets.value);

    // Check if offer is funded
    const fundedInput = offer.taker_pays_funded
      ? typeof offer.taker_pays_funded === 'string'
        ? parseFloat(offer.taker_pays_funded) / 1_000_000
        : parseFloat(offer.taker_pays_funded.value)
      : offerInput;

    const fundedOutput = offer.taker_gets_funded
      ? typeof offer.taker_gets_funded === 'string'
        ? parseFloat(offer.taker_gets_funded) / 1_000_000
        : parseFloat(offer.taker_gets_funded.value)
      : offerOutput;

    // Calculate rate for this offer
    const rate = fundedOutput / fundedInput;

    if (remainingInput <= fundedInput) {
      // We can fill the rest with this offer
      totalOutput += remainingInput * rate;
      totalInputUsed += remainingInput;
      remainingInput = 0;
    } else {
      // Consume the entire offer
      totalOutput += fundedOutput;
      totalInputUsed += fundedInput;
      remainingInput -= fundedInput;
    }
  }

  const inputNum = parseFloat(inputAmount);
  const fillPercentage = inputNum > 0 ? totalInputUsed / inputNum : 0;

  // Calculate price impact (compare best offer rate to average fill rate)
  let priceImpact = 0;
  if (sortedOffers.length > 0 && totalInputUsed > 0) {
    const firstOffer = sortedOffers[0];
    const firstOfferInput =
      typeof firstOffer.TakerPays === 'string'
        ? parseFloat(firstOffer.TakerPays) / 1_000_000
        : parseFloat(firstOffer.TakerPays.value);
    const firstOfferOutput =
      typeof firstOffer.TakerGets === 'string'
        ? parseFloat(firstOffer.TakerGets) / 1_000_000
        : parseFloat(firstOffer.TakerGets.value);
    const bestRate = firstOfferOutput / firstOfferInput;
    const averageRate = totalOutput / totalInputUsed;
    priceImpact = Math.max(0, 1 - averageRate / bestRate);
  }

  return {
    outputAmount: totalOutput.toString(),
    fillPercentage,
    priceImpact
  };
};

/**
 * Build an AMM swap transaction (Payment with SendMax and DeliverMin).
 * This creates a self-payment that routes through the AMM pool.
 *
 * @param params - The swap parameters
 * @returns The Payment transaction object
 */
export const buildAMMSwapTransaction = (params: AMMSwapParams): Payment => {
  const { account, sourceToken, destToken, sourceAmount, expectedOutput, minimumReceived } = params;

  // Build Amount (what we want to receive)
  const amount: Amount =
    destToken.currency === 'XRP'
      ? (parseFloat(expectedOutput) * 1_000_000).toString() // XRP in drops
      : {
          currency: destToken.currency,
          issuer: destToken.issuer!,
          value: expectedOutput
        };

  // Build SendMax (maximum we're willing to pay)
  const sendMax: Amount =
    sourceToken.currency === 'XRP'
      ? (parseFloat(sourceAmount) * 1_000_000).toString() // XRP in drops
      : {
          currency: sourceToken.currency,
          issuer: sourceToken.issuer!,
          value: sourceAmount
        };

  // Build DeliverMin (minimum we're willing to receive)
  const deliverMin: Amount =
    destToken.currency === 'XRP'
      ? (parseFloat(minimumReceived) * 1_000_000).toString() // XRP in drops
      : {
          currency: destToken.currency,
          issuer: destToken.issuer!,
          value: minimumReceived
        };

  return {
    TransactionType: 'Payment',
    Account: account,
    Destination: account, // Self-payment routes through AMM
    Amount: amount,
    SendMax: sendMax,
    DeliverMin: deliverMin,
    Flags: PAYMENT_FLAGS.tfPartialPayment
  };
};

/**
 * Build a DEX swap transaction (OfferCreate with ImmediateOrCancel).
 *
 * @param params - The swap parameters
 * @returns The OfferCreate transaction object
 */
export const buildDEXSwapTransaction = (params: DEXSwapParams): OfferCreate => {
  const { account, takerGets, takerPays } = params;

  return {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: takerGets, // What we want to receive
    TakerPays: takerPays, // What we're willing to pay
    Flags: OFFER_CREATE_FLAGS.tfImmediateOrCancel
  };
};

/**
 * Build a fee payment transaction.
 *
 * @param params - The fee payment parameters
 * @returns The Payment transaction object
 */
export const buildFeePayment = (params: FeePaymentParams): Payment => {
  const { account, feeAmount, feeCurrency, feeIssuer, feeRecipient } = params;

  const amount: Amount =
    feeCurrency === 'XRP'
      ? (parseFloat(feeAmount) * 1_000_000).toString() // XRP in drops
      : {
          currency: feeCurrency,
          issuer: feeIssuer!,
          value: feeAmount
        };

  return {
    TransactionType: 'Payment',
    Account: account,
    Destination: feeRecipient,
    Amount: amount
  };
};

/**
 * Build a batch transaction containing the swap and fee payment.
 * Note: This is prepared for future use when batch transactions are enabled on mainnet.
 *
 * @param params - The batch transaction parameters
 * @returns The Batch transaction object
 */
export const buildBatchSwapTransaction = (
  params: BatchTransactionParams
): { TransactionType: string; RawTransactions: object[]; Flags: number } | null => {
  if (!USE_BATCH_TRANSACTIONS) {
    return null;
  }

  const { swapTransaction, feeTransaction } = params;

  // Prepare inner transactions with batch flags
  const innerSwapTx = {
    ...swapTransaction,
    Flags: ((swapTransaction as { Flags?: number }).Flags || 0) | TF_INNER_BATCH_TXN,
    Fee: '0',
    SigningPubKey: ''
  };

  const innerFeeTx = {
    ...feeTransaction,
    Flags: TF_INNER_BATCH_TXN,
    Fee: '0',
    SigningPubKey: ''
  };

  return {
    TransactionType: 'Batch',
    RawTransactions: [{ RawTransaction: innerSwapTx }, { RawTransaction: innerFeeTx }],
    Flags: BATCH_FLAGS.tfAllOrNothing
  };
};

/**
 * Parse an Amount from XRPL format to a number.
 *
 * @param amount - The Amount in XRPL format
 * @returns The amount as a number
 */
export const parseAmount = (amount: Amount): number => {
  if (typeof amount === 'string') {
    return parseFloat(amount) / 1_000_000; // XRP in drops
  }
  return parseFloat(amount.value);
};

/**
 * Format an amount for display.
 *
 * @param amount - The amount as a number or string
 * @param decimals - Number of decimal places (default: 6)
 * @returns The formatted amount string
 */
export const formatSwapAmount = (amount: number | string, decimals: number = 6): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  // Use adaptive precision
  if (Math.abs(num) >= 1000) return num.toFixed(2);
  if (Math.abs(num) >= 1) return num.toFixed(4);
  return num.toFixed(decimals);
};

/**
 * Check if two tokens are the same.
 */
export const isSameToken = (token1: SwapToken | null, token2: SwapToken | null): boolean => {
  if (!token1 || !token2) return false;
  return token1.currency === token2.currency && (token1.issuer || '') === (token2.issuer || '');
};
