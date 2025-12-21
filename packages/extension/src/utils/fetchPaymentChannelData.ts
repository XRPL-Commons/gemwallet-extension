import { Client } from 'xrpl';

// XRPL epoch starts at 2000-01-01T00:00:00Z
const RIPPLE_EPOCH = 946684800;

export interface PaymentChannelObject {
  LedgerEntryType: 'PayChannel';
  Account: string;
  Destination: string;
  Amount: string; // Total XRP in drops that can be claimed
  Balance: string; // XRP in drops already claimed
  PublicKey: string;
  SettleDelay: number;
  OwnerNode: string;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  Flags: number;
  Expiration?: number;
  CancelAfter?: number;
  SourceTag?: number;
  DestinationTag?: number;
  DestinationNode?: string;
  index: string;
}

export type PaymentChannelStatus = 'active' | 'expiring' | 'expired';

export interface PaymentChannelDisplayData extends PaymentChannelObject {
  status: PaymentChannelStatus;
  canFund: boolean;
  canClaim: boolean;
  formattedAmount: string;
  formattedBalance: string;
  remainingAmount: string;
  expirationDate?: Date;
  cancelAfterDate?: Date;
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
 * Convert drops to XRP
 */
export const dropsToXrp = (drops: string): number => {
  return Number(drops) / 1_000_000;
};

/**
 * Calculate payment channel status based on expiration and cancel_after
 */
export const getPaymentChannelStatus = (channel: PaymentChannelObject): PaymentChannelStatus => {
  const now = getCurrentRippleTime();

  // Check if fully expired (past CancelAfter or Expiration)
  if (channel.CancelAfter && now >= channel.CancelAfter) {
    return 'expired';
  }

  if (channel.Expiration && now >= channel.Expiration) {
    return 'expired';
  }

  // Check if close is pending (Expiration is set but not yet reached)
  if (channel.Expiration) {
    return 'expiring';
  }

  return 'active';
};

/**
 * Determine if payment channel can be funded (only source can fund)
 */
export const canFundChannel = (channel: PaymentChannelObject, currentAddress: string): boolean => {
  // Only source can fund
  if (channel.Account !== currentAddress) {
    return false;
  }

  // Cannot fund expired channels
  if (getPaymentChannelStatus(channel) === 'expired') {
    return false;
  }

  return true;
};

/**
 * Determine if payment channel can be claimed
 */
export const canClaimChannel = (channel: PaymentChannelObject, currentAddress: string): boolean => {
  const status = getPaymentChannelStatus(channel);
  const claimedAmount = Number(channel.Balance);
  const totalAmount = Number(channel.Amount);

  // Nothing left to claim
  if (claimedAmount >= totalAmount) {
    return false;
  }

  // Source can claim to close the channel (renounce claim)
  if (channel.Account === currentAddress) {
    return true;
  }

  // Destination can claim if channel is not expired
  if (channel.Destination === currentAddress && status !== 'expired') {
    return true;
  }

  return false;
};

/**
 * Fetch all payment channel objects for an account
 */
export const fetchPaymentChannels = async (
  client: Client,
  address: string
): Promise<PaymentChannelObject[]> => {
  try {
    const response = await client.request({
      command: 'account_objects',
      account: address,
      ledger_index: 'validated',
      type: 'payment_channel'
    });

    return (response.result.account_objects as unknown as PaymentChannelObject[]) || [];
  } catch (error) {
    console.error('Error fetching payment channels:', error);
    return [];
  }
};

/**
 * Get full payment channel display data with calculated status and permissions
 */
export const getPaymentChannelDisplayData = (
  channel: PaymentChannelObject,
  currentAddress: string
): PaymentChannelDisplayData => {
  const status = getPaymentChannelStatus(channel);
  const amountXrp = dropsToXrp(channel.Amount);
  const balanceXrp = dropsToXrp(channel.Balance);
  const remainingXrp = amountXrp - balanceXrp;

  return {
    ...channel,
    status,
    canFund: canFundChannel(channel, currentAddress),
    canClaim: canClaimChannel(channel, currentAddress),
    formattedAmount: amountXrp.toFixed(6),
    formattedBalance: balanceXrp.toFixed(6),
    remainingAmount: remainingXrp.toFixed(6),
    expirationDate: channel.Expiration ? rippleTimeToDate(channel.Expiration) : undefined,
    cancelAfterDate: channel.CancelAfter ? rippleTimeToDate(channel.CancelAfter) : undefined
  };
};

/**
 * Fetch all payment channels with display data for an account
 */
export const fetchAllPaymentChannelDisplayData = async (
  client: Client,
  address: string
): Promise<PaymentChannelDisplayData[]> => {
  const channels = await fetchPaymentChannels(client, address);

  if (channels.length === 0) {
    return [];
  }

  return channels.map((channel) => getPaymentChannelDisplayData(channel, address));
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
export const formatChannelDate = (date: Date): string => {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get percentage of channel amount that has been claimed
 */
export const getClaimedPercentage = (channel: PaymentChannelObject): number => {
  const amount = Number(channel.Amount);
  const balance = Number(channel.Balance);

  if (amount === 0) return 0;

  return (balance / amount) * 100;
};
