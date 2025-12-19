/**
 * MPToken types for Multi-Purpose Tokens on XRPL
 */

/**
 * Raw MPToken object returned from account_objects with type: 'mptoken'
 */
export interface MPTokenObject {
  MPTokenIssuanceID: string;
  MPTAmount: string;
  Flags: number;
  LedgerEntryType: 'MPToken';
  OwnerNode?: string;
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
  index: string;
}

/**
 * MPTokenIssuance object returned from ledger_entry
 */
export interface MPTokenIssuance {
  LedgerEntryType: 'MPTokenIssuance';
  Flags: number;
  Issuer: string;
  AssetScale?: number;
  MaximumAmount?: string;
  OutstandingAmount?: string;
  TransferFee?: number;
  MPTokenMetadata?: string; // Hex-encoded JSON following XLS-89 spec
  OwnerNode?: string;
  index: string;
}

/**
 * Decoded MPToken metadata following XLS-89 spec
 * Short field names (t, n, d, i) and long names (ticker, name, desc, icon) are both supported
 */
export interface MPTokenMetadata {
  // Ticker/symbol (short: t, long: ticker)
  ticker?: string;
  t?: string;
  // Token name (short: n, long: name)
  name?: string;
  n?: string;
  // Description (short: d, long: desc)
  description?: string;
  d?: string;
  desc?: string;
  // Icon URL (short: i, long: icon)
  icon?: string;
  i?: string;
  // Asset class (short: ac, long: asset_class)
  assetClass?: string;
  ac?: string;
  asset_class?: string;
  // Asset subclass (short: as, long: asset_subclass)
  assetSubclass?: string;
  as?: string;
  asset_subclass?: string;
  // Issuer name (short: in, long: issuer_name)
  issuerName?: string;
  in?: string;
  issuer_name?: string;
  // URLs array
  urls?: Array<{
    url?: string;
    u?: string;
    type?: string;
    c?: string;
    title?: string;
    t?: string;
  }>;
  us?: Array<{
    url?: string;
    u?: string;
    type?: string;
    c?: string;
    title?: string;
    t?: string;
  }>;
  // Additional info
  additionalInfo?: Record<string, unknown>;
  ai?: Record<string, unknown>;
  additional_info?: Record<string, unknown>;
}

/**
 * Parsed MPToken data for display
 */
export interface MPTokenDisplayData {
  mptIssuanceId: string;
  balance: string;
  formattedBalance: number;
  issuer: string;
  assetScale: number;
  // Metadata fields
  ticker?: string;
  name?: string;
  description?: string;
  iconUrl?: string;
  issuerName?: string;
  // Flags
  flags: number;
  // Can be removed (balance is 0)
  canRemove: boolean;
}

/**
 * MPTokenAuthorize transaction flags
 */
export enum MPTokenAuthorizeFlags {
  tfMPTUnauthorize = 0x00000001 // 1 - Revoke authorization
}
