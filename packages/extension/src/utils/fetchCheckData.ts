import { Client } from 'xrpl';

// XRPL epoch starts at 2000-01-01T00:00:00Z
const RIPPLE_EPOCH = 946684800;

export interface CheckObject {
  LedgerEntryType: 'Check';
  Account: string;
  Destination: string;
  SendMax: string | { currency: string; issuer: string; value: string };
  Sequence: number;
  Flags: number;
  OwnerNode: string;
  DestinationNode?: string;
  DestinationTag?: number;
  Expiration?: number;
  InvoiceID?: string;
  SourceTag?: number;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  index: string;
}

export type CheckStatus = 'active' | 'expired';

export interface CheckDisplayData extends CheckObject {
  status: CheckStatus;
  canCash: boolean;
  canCancel: boolean;
  formattedAmount: string;
  currency: string;
  issuer?: string;
  expirationDate?: Date;
}

/**
 * Convert XRPL timestamp to JavaScript Date
 */
export const rippleTimeToDate = (rippleTime: number): Date => {
  return new Date((rippleTime + RIPPLE_EPOCH) * 1000);
};

/**
 * Get current XRPL time (seconds since XRPL epoch)
 */
export const getCurrentRippleTime = (): number => {
  return Math.floor(Date.now() / 1000) - RIPPLE_EPOCH;
};

/**
 * Calculate check status based on expiration
 */
export const getCheckStatus = (check: CheckObject): CheckStatus => {
  const now = getCurrentRippleTime();

  if (check.Expiration && now >= check.Expiration) {
    return 'expired';
  }

  return 'active';
};

/**
 * Determine if check can be cashed
 */
export const canCashCheck = (check: CheckObject, currentAddress: string): boolean => {
  // Only destination can cash
  if (check.Destination !== currentAddress) {
    return false;
  }

  // Cannot cash if expired
  if (getCheckStatus(check) === 'expired') {
    return false;
  }

  return true;
};

/**
 * Determine if check can be cancelled
 */
export const canCancelCheck = (check: CheckObject, currentAddress: string): boolean => {
  // Source can always cancel their own checks
  if (check.Account === currentAddress) {
    return true;
  }

  // Destination can cancel expired checks
  if (check.Destination === currentAddress && getCheckStatus(check) === 'expired') {
    return true;
  }

  return false;
};

/**
 * Fetch all check objects for an account
 */
export const fetchChecks = async (client: Client, address: string): Promise<CheckObject[]> => {
  try {
    const response = await client.request({
      command: 'account_objects',
      account: address,
      ledger_index: 'validated',
      type: 'check'
    });

    return (response.result.account_objects as unknown as CheckObject[]) || [];
  } catch (error) {
    console.error('Error fetching checks:', error);
    return [];
  }
};

/**
 * Convert drops to XRP
 */
export const dropsToXrp = (drops: string): number => {
  return Number(drops) / 1_000_000;
};

/**
 * Parse SendMax to get amount, currency, and issuer
 */
export const parseSendMax = (
  sendMax: string | { currency: string; issuer: string; value: string }
): { amount: string; currency: string; issuer?: string } => {
  if (typeof sendMax === 'string') {
    return {
      amount: String(dropsToXrp(sendMax)),
      currency: 'XRP'
    };
  }

  return {
    amount: sendMax.value,
    currency: sendMax.currency,
    issuer: sendMax.issuer
  };
};

/**
 * Get full check display data with calculated status and permissions
 */
export const getCheckDisplayData = (
  check: CheckObject,
  currentAddress: string
): CheckDisplayData => {
  const status = getCheckStatus(check);
  const parsed = parseSendMax(check.SendMax);

  return {
    ...check,
    status,
    canCash: canCashCheck(check, currentAddress),
    canCancel: canCancelCheck(check, currentAddress),
    formattedAmount: parsed.amount,
    currency: parsed.currency,
    issuer: parsed.issuer,
    expirationDate: check.Expiration ? rippleTimeToDate(check.Expiration) : undefined
  };
};

/**
 * Fetch all checks with display data for an account
 */
export const fetchAllCheckDisplayData = async (
  client: Client,
  address: string
): Promise<CheckDisplayData[]> => {
  const checks = await fetchChecks(client, address);

  if (checks.length === 0) {
    return [];
  }

  return checks.map((check) => getCheckDisplayData(check, address));
};

/**
 * Truncate address for display
 */
export const truncateAddress = (address: string, prefixLength = 8, suffixLength = 6): string => {
  if (address.length <= prefixLength + suffixLength + 3) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Format date for display
 */
export const formatCheckDate = (date: Date): string => {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
