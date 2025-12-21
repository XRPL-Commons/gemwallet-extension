import { Client } from 'xrpl';

// XRPL epoch starts at 2000-01-01T00:00:00Z
const RIPPLE_EPOCH = 946684800;

export interface EscrowObject {
  LedgerEntryType: 'Escrow';
  Account: string;
  Destination: string;
  Amount: string;
  Condition?: string;
  CancelAfter?: number;
  FinishAfter?: number;
  Flags: number;
  SourceTag?: number;
  DestinationTag?: number;
  OwnerNode: string;
  DestinationNode?: string;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  index: string;
}

export type EscrowStatus =
  | 'pending'
  | 'ready_to_finish'
  | 'ready_to_cancel'
  | 'conditional'
  | 'expired';

export interface EscrowDisplayData extends EscrowObject {
  status: EscrowStatus;
  canFinish: boolean;
  canCancel: boolean;
  formattedAmount: number;
  finishAfterDate?: Date;
  cancelAfterDate?: Date;
}

/**
 * Convert XRPL timestamp to JavaScript Date
 */
export const rippleTimeToDate = (rippleTime: number): Date => {
  return new Date((rippleTime + RIPPLE_EPOCH) * 1000);
};

/**
 * Convert JavaScript Date to XRPL timestamp
 */
export const dateToRippleTime = (date: Date): number => {
  return Math.floor(date.getTime() / 1000) - RIPPLE_EPOCH;
};

/**
 * Get current XRPL time (seconds since XRPL epoch)
 */
export const getCurrentRippleTime = (): number => {
  return Math.floor(Date.now() / 1000) - RIPPLE_EPOCH;
};

/**
 * Calculate escrow status based on time conditions
 */
export const getEscrowStatus = (escrow: EscrowObject): EscrowStatus => {
  const now = getCurrentRippleTime();

  // If has condition, it's conditional (needs fulfillment)
  if (escrow.Condition) {
    // Even conditional escrows can be cancelled after CancelAfter
    if (escrow.CancelAfter && now >= escrow.CancelAfter) {
      return 'ready_to_cancel';
    }
    return 'conditional';
  }

  // Check if ready to cancel (CancelAfter time has passed)
  if (escrow.CancelAfter && now >= escrow.CancelAfter) {
    return 'ready_to_cancel';
  }

  // Check if ready to finish (FinishAfter time has passed)
  if (escrow.FinishAfter && now >= escrow.FinishAfter) {
    return 'ready_to_finish';
  }

  // Still pending
  return 'pending';
};

/**
 * Determine if escrow can be finished
 */
export const canFinishEscrow = (escrow: EscrowObject, currentAddress: string): boolean => {
  const now = getCurrentRippleTime();

  // Must be either source or destination to finish
  if (escrow.Account !== currentAddress && escrow.Destination !== currentAddress) {
    return false;
  }

  // If has FinishAfter, time must have passed
  if (escrow.FinishAfter && now < escrow.FinishAfter) {
    return false;
  }

  // If has CancelAfter and it's passed, cannot finish (only cancel)
  if (escrow.CancelAfter && now >= escrow.CancelAfter) {
    return false;
  }

  return true;
};

/**
 * Determine if escrow can be cancelled
 */
export const canCancelEscrow = (escrow: EscrowObject, currentAddress: string): boolean => {
  const now = getCurrentRippleTime();

  // Only source account can cancel
  if (escrow.Account !== currentAddress) {
    return false;
  }

  // Must have CancelAfter set and time must have passed
  if (!escrow.CancelAfter || now < escrow.CancelAfter) {
    return false;
  }

  return true;
};

/**
 * Fetch all escrow objects for an account
 */
export const fetchEscrows = async (client: Client, address: string): Promise<EscrowObject[]> => {
  try {
    const response = await client.request({
      command: 'account_objects',
      account: address,
      ledger_index: 'validated',
      type: 'escrow'
    });

    return (response.result.account_objects as unknown as EscrowObject[]) || [];
  } catch (error) {
    console.error('Error fetching escrows:', error);
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
 * Get full escrow display data with calculated status and permissions
 */
export const getEscrowDisplayData = (
  escrow: EscrowObject,
  currentAddress: string
): EscrowDisplayData => {
  const status = getEscrowStatus(escrow);

  return {
    ...escrow,
    status,
    canFinish: canFinishEscrow(escrow, currentAddress),
    canCancel: canCancelEscrow(escrow, currentAddress),
    formattedAmount: dropsToXrp(escrow.Amount),
    finishAfterDate: escrow.FinishAfter ? rippleTimeToDate(escrow.FinishAfter) : undefined,
    cancelAfterDate: escrow.CancelAfter ? rippleTimeToDate(escrow.CancelAfter) : undefined
  };
};

/**
 * Fetch all escrows with display data for an account
 */
export const fetchAllEscrowDisplayData = async (
  client: Client,
  address: string
): Promise<EscrowDisplayData[]> => {
  const escrows = await fetchEscrows(client, address);

  if (escrows.length === 0) {
    return [];
  }

  return escrows.map((escrow) => getEscrowDisplayData(escrow, address));
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
export const formatEscrowDate = (date: Date): string => {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
