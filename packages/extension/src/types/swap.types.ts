import { Amount } from 'xrpl';

export interface SwapToken {
  currency: string;
  issuer?: string;
  value?: string;
  name?: string;
  icon?: string;
}

export interface SwapQuote {
  sourceAmount: string;
  destinationAmount: string;
  rate: number;
  priceImpact: number;
  route: SwapRoute;
  fee: SwapFee;
  minimumReceived: string;
  ammQuote?: AMMQuote;
  dexQuote?: DEXQuote;
}

export type SwapRoute = 'AMM' | 'DEX';

export interface SwapFee {
  amount: string;
  currency: string;
  issuer?: string;
}

export interface AMMQuote {
  poolExists: boolean;
  poolAmount1: string;
  poolAmount2: string;
  tradingFee: number;
  expectedOutput: string;
  priceImpact: number;
}

export interface DEXQuote {
  offersAvailable: boolean;
  expectedOutput: string;
  fillPercentage: number;
  priceImpact: number;
}

export interface SwapSettings {
  slippage: number;
  useCustomSlippage: boolean;
}

export interface SwapData {
  fromToken: SwapToken;
  toToken: SwapToken;
  amount: string;
  quote: SwapQuote;
  slippage: number;
}

export interface BookOffer {
  Account: string;
  BookDirectory: string;
  BookNode: string;
  Flags: number;
  LedgerEntryType: string;
  OwnerNode: string;
  Sequence: number;
  TakerGets: Amount;
  TakerPays: Amount;
  index: string;
  owner_funds?: string;
  quality?: string;
  taker_gets_funded?: Amount;
  taker_pays_funded?: Amount;
}

export interface BookOffersResult {
  offers: BookOffer[];
  ledger_current_index?: number;
  ledger_index?: number;
  ledger_hash?: string;
}

// Transaction building types
export interface AMMSwapParams {
  account: string;
  sourceToken: SwapToken;
  destToken: SwapToken;
  sourceAmount: string;
  expectedOutput: string;
  minimumReceived: string;
}

export interface DEXSwapParams {
  account: string;
  takerGets: Amount;
  takerPays: Amount;
}

export interface FeePaymentParams {
  account: string;
  feeAmount: string;
  feeCurrency: string;
  feeIssuer?: string;
  feeRecipient: string;
}

// Batch transaction types (for future use)
export interface BatchTransactionParams {
  swapTransaction: object;
  feeTransaction: object;
}
