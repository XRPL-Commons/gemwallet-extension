import { SwapToken } from '../types/swap.types';

// Fee configuration
export const SWAP_FEE_PERCENTAGE = 0.001; // 0.1%

// Fee recipient addresses per network
// TODO: Replace with actual fee collection addresses
export const SWAP_FEE_ADDRESSES: Record<string, string> = {
  Mainnet: 'rGemWaLLetXXXXXXXXXXXXXXXXXXXXXXX', // Placeholder - set real address
  Testnet: 'rGemWaLLetXXXXXXXXXXXXXXXXXXXXXXX', // Placeholder - set real address
  Devnet: 'rGemWaLLetXXXXXXXXXXXXXXXXXXXXXXX' // Placeholder - set real address
};

// Slippage options (as decimals)
export const SLIPPAGE_OPTIONS = [0.001, 0.005, 0.01, 0.03]; // 0.1%, 0.5%, 1%, 3%
export const DEFAULT_SLIPPAGE = 0.005; // 0.5%
export const HIGH_SLIPPAGE_WARNING_THRESHOLD = 0.03; // 3%
export const MAX_SLIPPAGE = 0.5; // 50%

// Quote refresh interval in milliseconds
export const QUOTE_REFRESH_INTERVAL = 15000; // 15 seconds

// Price impact thresholds
export const PRICE_IMPACT_WARNING_THRESHOLD = 0.03; // 3%
export const PRICE_IMPACT_HIGH_THRESHOLD = 0.05; // 5%
export const PRICE_IMPACT_BLOCK_THRESHOLD = 0.15; // 15%

// Popular tokens for mainnet
export const POPULAR_TOKENS_MAINNET: SwapToken[] = [
  { currency: 'XRP', name: 'XRP' },
  {
    currency: 'USD',
    issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
    name: 'Gatehub USD'
  },
  {
    currency: 'EUR',
    issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
    name: 'Gatehub EUR'
  },
  {
    currency: 'BTC',
    issuer: 'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL',
    name: 'Gatehub BTC'
  },
  {
    currency: 'ETH',
    issuer: 'rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h',
    name: 'Gatehub ETH'
  },
  {
    currency: 'USD',
    issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
    name: 'Bitstamp USD'
  },
  {
    currency: 'BTC',
    issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
    name: 'Bitstamp BTC'
  },
  {
    currency: 'SOLO',
    issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
    name: 'Sologenic'
  },
  {
    currency: 'CSC',
    issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
    name: 'CasinoCoin'
  },
  {
    currency: 'XRdoge',
    issuer: 'rLqUC2eCPohYvJCEBJ77eCCqVL2uEiczjA',
    name: 'XRdoge'
  }
];

// Popular tokens for testnet
export const POPULAR_TOKENS_TESTNET: SwapToken[] = [
  { currency: 'XRP', name: 'XRP' },
  {
    currency: 'USD',
    issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
    name: 'Test USD'
  },
  {
    currency: 'EUR',
    issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
    name: 'Test EUR'
  }
];

// Get popular tokens by network
export const getPopularTokens = (networkName: string): SwapToken[] => {
  switch (networkName) {
    case 'Mainnet':
      return POPULAR_TOKENS_MAINNET;
    case 'Testnet':
    case 'Devnet':
      return POPULAR_TOKENS_TESTNET;
    default:
      return [{ currency: 'XRP', name: 'XRP' }];
  }
};

// Get fee address by network
export const getFeeAddress = (networkName: string): string | undefined => {
  return SWAP_FEE_ADDRESSES[networkName];
};

// OfferCreate flags
export const OFFER_CREATE_FLAGS = {
  tfPassive: 0x00010000, // 65536
  tfImmediateOrCancel: 0x00020000, // 131072
  tfFillOrKill: 0x00040000, // 262144
  tfSell: 0x00080000 // 524288
};

// Payment flags
export const PAYMENT_FLAGS = {
  tfPartialPayment: 0x00020000 // 131072
};

// Batch transaction flags (for future use)
export const BATCH_FLAGS = {
  tfAllOrNothing: 0x00010000, // 65536
  tfOnlyOne: 0x00020000, // 131072
  tfUntilFailure: 0x00040000, // 262144
  tfIndependent: 0x00080000 // 524288
};

// Inner batch transaction flag
export const TF_INNER_BATCH_TXN = 0x40000000; // 1073741824

// Whether to use batch transactions (disabled until mainnet support)
export const USE_BATCH_TRANSACTIONS = false;
