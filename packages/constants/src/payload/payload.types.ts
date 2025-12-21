import {
  AccountSetAsfFlags,
  Path,
  SubmittableTransaction,
  Currency,
  AuthAccount,
  PriceData,
  IssuedCurrency
} from 'xrpl';
import { Amount, IssuedCurrencyAmount } from 'xrpl/dist/npm/models/common';

import { Network } from '../network/network.constant';
import {
  Memo,
  MintNFTFlags,
  PaymentFlags,
  Signer,
  TrustSetFlags,
  CreateNFTOfferFlags,
  SetAccountFlags,
  CreateOfferFlags,
  DepositAMMFlags,
  WithdrawAMMFlags,
  MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSetFlags,
  MPTokenAuthorizeFlags
} from '../xrpl/basic.types';
import { Hook } from '../xrpl/hooks.types';
import { AccountNFToken, AccountNFTokenResponse, NFTokenIDResponse } from '../xrpl/nft.types';

/*
 * Request Payloads
 */

export interface GetNetworkRequest {
  id: number | undefined;
}

export interface WebsiteRequest {
  url: string;
  title: string;
  favicon: string | null | undefined;
}

export interface BaseTransactionRequest {
  // Integer amount of XRP, in drops, to be destroyed as a cost for distributing this transaction to the network.
  // Some transaction types have different minimum requirements.
  fee?: string;
  // The sequence number of the account sending the transaction. A transaction is only valid if the Sequence number is
  // exactly 1 greater than the previous transaction from the same account. The special case 0 means the transaction is
  // using a Ticket instead.
  sequence?: number;
  // Hash value identifying another transaction. If provided, this transaction is only valid if the sending account's
  // previously-sent transaction matches the provided hash.
  accountTxnID?: string;
  // Highest ledger index this transaction can appear in. Specifying this field places a strict upper limit on how long
  // the transaction can wait to be validated or rejected.
  lastLedgerSequence?: number;
  // Additional arbitrary information used to identify this transaction.
  // Each attribute of each memo must be hex encoded.
  memos?: Memo[];
  // The network ID of the chain this transaction is intended for. MUST BE OMITTED for XRPL Mainnet and some test
  // networks. REQUIRED on chains whose network ID is 1025 or higher.
  networkID?: number;
  // Array of objects that represent a multi-signature which authorizes this transaction.
  signers?: Signer[];
  // Arbitrary integer used to identify the reason for this payment, or a sender on whose behalf this transaction is
  // made. Conventionally, a refund should specify the initial payment's SourceTag as the refund payment's
  // DestinationTag.
  sourceTag?: number;
  // Hex representation of the public key that corresponds to the private key used to sign this transaction. If an empty
  // string, indicates a multi-signature is present in the Signers field instead.
  signingPubKey?: string;
  // The sequence number of the ticket to use in place of a Sequence number. If this is provided, Sequence must be 0.
  // Cannot be used with AccountTxnID.
  ticketSequence?: number;
  // The signature that verifies this transaction as originating from the account it says it is from.
  txnSignature?: string;
}

export interface SendPaymentRequest extends BaseTransactionRequest {
  // The amount to deliver, in one of the following formats:
  // - A string representing the number of XRP to deliver, in drops.
  // - An object where 'value' is a string representing the number of the token to deliver.
  amount: Amount;
  // The unique address of the account receiving the payment
  destination: string;
  // The destination tag to attach to the transaction
  destinationTag?: number;
  // Arbitrary 256-bit hash representing a specific reason or identifier for this payment.
  invoiceID?: string;
  // Array of payment paths to be used for this transaction. Must be omitted for XRP-to-XRP transactions.
  paths?: Path[];
  // Highest amount of source currency this transaction is allowed to cost, including transfer fees, exchange rates,
  // and slippage . Does not include the XRP destroyed as a cost for submitting the transaction.
  // For non-XRP amounts, the nested field names MUST be lower-case.
  // Must be supplied for cross-currency/cross-issue payments. Must be omitted for XRP-to-XRP Payments.
  sendMax?: Amount;
  // Minimum amount of destination currency this transaction should deliver. Only valid if this is a partial payment.
  // For non-XRP amounts, the nested field names are lower-case.
  deliverMin?: Amount;
  // Flags to set on the transaction
  flags?: PaymentFlags;
}

export interface SendPaymentRequestDeprecated {
  // The amount of currency to deliver (in currency, not drops)
  amount: string;
  // The token that can be used
  currency?: string;
  // The issuer of the token
  issuer?: string;
  // The memo to attach to the transaction
  memo?: string;
  // The destination tag to attach to the transaction
  destinationTag?: string;
}

export interface SetTrustlineRequest extends BaseTransactionRequest {
  // The maximum amount of currency that can be exchanged to the trustline
  limitAmount: IssuedCurrencyAmount;
  // Value incoming balances on this trust line at the ratio of this number per 1,000,000,000 units.
  // A value of 0 is shorthand for treating balances at face value.
  qualityIn?: number;
  // Value outgoing balances on this trust line at the ratio of this number per 1,000,000,000 units.
  // A value of 0 is shorthand for treating balances at face value.
  qualityOut?: number;
  // Flags to set on the transaction
  flags?: TrustSetFlags;
}

export interface SetTrustlineRequestDeprecated {
  // The token to be used
  currency: string;
  // The address of the account owing the token
  issuer: string;
  // Integer amount of XRP, in drops, to be destroyed as a cost for distributing this transaction to the network.
  // Some transaction types have different minimum requirements.
  fee?: string;
  // 	The maximum amount of currency that can be exchanged to the trustline
  value: string;
}

export interface MintNFTRequest extends BaseTransactionRequest {
  flags?: MintNFTFlags;
  // Indicates the issuer of the token.
  // Should only be specified if the account executing the transaction is not the Issuer of the token, e.g. when minting on behalf of another account.
  issuer?: string;
  // Indicates the taxon associated with this token. The taxon is generally a value chosen by the minter of the token
  // and a given taxon may be used for multiple tokens. The implementation reserves taxon identifiers greater than or
  // equal to 2147483648 (0x80000000). If you have no use for this field, set it to 0.
  NFTokenTaxon: number;
  // Specifies the fee charged by the issuer for secondary sales of the Token, if such sales are allowed. Valid values
  // for this field are between 0 and 50000 inclusive, allowing transfer rates between 0.000% and 50.000% in increments
  // of 0.001%. This field must NOT be present if the tfTransferable flag is not set.
  transferFee?: number;
  // URI that points to the data and/or metadata associated with the NFT. This field need not be an HTTP or HTTPS URL;
  // it could be an IPFS URI, a magnet link, immediate data encoded as an RFC2379 "data" URL, or even an opaque
  // issuer-specific encoding. The URI is NOT checked for validity, but the field is limited to a maximum length of
  // 256 bytes.
  // This field must be hex-encoded.
  URI?: string;
}

export interface CreateNFTOfferRequest extends BaseTransactionRequest {
  // Identifies the NFTokenID of the NFToken object that the offer references.
  NFTokenID: string;
  // Indicates the amount expected or offered for the Token.
  // The amount must be non-zero, except when this is a sell offer and the asset is XRP. This would indicate that the
  // current owner of the token is giving it away free, either to anyone at all, or to the account identified by the
  // Destination field.
  amount: Amount;
  // Indicates the AccountID of the account that owns the corresponding NFToken.
  // If the offer is to buy a token, this field must be present and it must be different than Account (since an offer
  // to buy a token one already holds is meaningless).
  // If the offer is to sell a token, this field must not be present, as the owner is, implicitly, the same as Account
  // (since an offer to sell a token one doesn't already hold is meaningless).
  owner?: string;
  // Indicates the time after which the offer will no longer be valid. The value is the number of seconds since the
  // Ripple Epoch.
  expiration?: number;
  // If present, indicates that this offer may only be accepted by the specified account. Attempts by other accounts to
  // accept this offer MUST fail.
  destination?: string;
  flags?: CreateNFTOfferFlags;
}

export interface CancelNFTOfferRequest extends BaseTransactionRequest {
  // An array of IDs of the NFTokenOffer objects to cancel (not the IDs of NFToken objects, but the IDs of the
  // NFTokenOffer objects). Each entry must be a different object ID of an NFTokenOffer object; the transaction is
  // invalid if the array contains duplicate entries.
  NFTokenOffers: string[];
}

export interface AcceptNFTOfferRequest extends BaseTransactionRequest {
  // Identifies the NFTokenOffer that offers to sell the NFToken.
  NFTokenSellOffer?: string;
  // Identifies the NFTokenOffer that offers to buy the NFToken.
  NFTokenBuyOffer?: string;
  // This field is only valid in brokered mode, and specifies the amount that the broker keeps as part of their fee for
  // bringing the two offers together; the remaining amount is sent to the seller of the NFToken being bought.
  // If specified, the fee must be such that, before applying the transfer fee, the amount that the seller would receive
  // is at least as much as the amount indicated in the sell offer.
  NFTokenBrokerFee?: Amount;
}

export interface BurnNFTRequest extends BaseTransactionRequest {
  // The NFToken to be removed by this transaction.
  NFTokenID: string;
  // The owner of the NFToken to burn. Only used if that owner is different than the account sending this transaction.
  // The issuer or authorized minter can use this field to burn NFTs that have the lsfBurnable flag enabled.
  owner?: string;
}

export interface GetNFTRequest {
  // Limit the number of NFTokens to retrieve.
  limit?: number;
  // Value from a previous paginated response. Resume retrieving data where that response left off.
  marker?: unknown;
}

export interface SignMessageRequest {
  url: string;
  title: string;
  favicon: string | null | undefined;
  message: string;
  isHex?: boolean;
}

export interface SetAccountRequest extends BaseTransactionRequest {
  flags?: SetAccountFlags;
  // Unique identifier of a flag to disable for this account.
  clearFlag?: number;
  // The domain that owns this account, as a string of hex representing the ASCII for the domain in lowercase.
  // Cannot be more than 256 bytes in length.
  domain?: string;
  // An arbitrary 128-bit value. Conventionally, clients treat this as the md5 hash of an email address to use for
  // displaying a Gravatar image.
  emailHash?: string;
  // Public key for sending encrypted messages to this account. To set the key, it must be exactly 33 bytes, with the
  // first byte indicating the key type: 0x02 or 0x03 for secp256k1 keys, 0xED for Ed25519 keys. To remove the key, use
  // an empty value.
  messageKey?: string;
  // Another account that can mint NFTokens for you.
  NFTokenMinter?: string;
  // Integer flag to enable for this account.
  setFlag?: AccountSetAsfFlags;
  // The fee to charge when users transfer this account's tokens, represented as billionths of a unit. Cannot be more
  // than 2000000000 or less than 1000000000, except for the special case 0 meaning no fee.
  transferRate?: number;
  // Tick size to use for offers involving a currency issued by this address. The exchange rates of those offers is
  // rounded to this many significant digits. Valid values are 3 to 15 inclusive, or 0 to disable.
  tickSize?: number;
}

export interface SetRegularKeyRequest extends BaseTransactionRequest {
  // A base-58-encoded Address that indicates the regular key pair to be assigned to the account. If omitted, removes
  // any existing regular key pair from the account. Must not match the master key pair for the address.
  regularKey?: string;
}

export interface CreateOfferRequest extends BaseTransactionRequest {
  flags?: CreateOfferFlags;
  // Time after which the Offer is no longer active, in seconds since the Ripple Epoch.
  expiration?: number;
  // An Offer to delete first, specified in the same way as OfferCancel.
  offerSequence?: number;
  // The amount and type of currency being sold.
  takerGets: Amount;
  // The amount and type of currency being bought.
  takerPays: Amount;
}

export interface CancelOfferRequest extends BaseTransactionRequest {
  // The sequence number (or Ticket number) of a previous OfferCreate transaction. If specified, cancel any offer object
  // in the ledger that was created by that transaction. It is not considered an error if the offer specified does not
  // exist.
  offerSequence: number;
}

export interface SubmitTransactionRequest {
  transaction: SubmittableTransaction;
}

export interface SignTransactionRequest {
  transaction: SubmittableTransaction;
}

export type TransactionWithID = SubmittableTransaction & {
  // Optional ID to identify the transaction in the response, after it has been submitted.
  // This id is only used as an indicator in the response, and is not used to order transactions.
  ID?: string;
};

export const DEFAULT_SUBMIT_TX_BULK_ON_ERROR = 'abort';

export type TransactionErrorHandling = 'abort' | 'continue';

export interface BaseBulkTransactionsRequest {
  // If set to false, the function will not wait for the transaction hashes to be returned from the XRPL. It makes the
  // execution faster, but the caller will not know the transaction hashes.
  // Default: true
  waitForHashes?: boolean;
  // If set to 'continue', the remaining transactions will be submitted even if one of them fails.
  // Default: 'abort'
  onError?: TransactionErrorHandling;
}

export interface SubmitBulkTransactionsRequest extends BaseBulkTransactionsRequest {
  transactions: TransactionWithID[];
}

export interface SubmitBulkTransactionsWithKeysRequest extends BaseBulkTransactionsRequest {
  // The key is used to guarantee that the transactions are submitted in the same order as they are in the request.
  transactions: Record<number, TransactionWithID>;
}

export interface SubmitStorageKeyRequest {
  storageKey: string;
}

export interface SetHookRequest extends BaseTransactionRequest {
  // Hooks array, which mirrors the Hook Chain installed on the account. Position 0 in the array corresponds to position
  // 0 in the Hook Chain, etc.
  hooks: Hook[];
}

/*
 * Multi-Purpose Tokens (MPT) Request Payloads
 */
export interface MPTokenIssuanceCreateRequest extends BaseTransactionRequest {
  // The maximum number of tokens that can ever be issued by this issuance.
  MaximumAmount?: string;
  // An arbitrary 256-bit hash or identifier for the asset.
  AssetScale?: number;
  // The fee, in tenths of a basis point, charged to transfer MPTs between non-issuer accounts.
  TransferFee?: number;
  // A URI pointing to metadata about this issuance.
  MPTokenMetadata?: string;
  // Flags to set on the transaction.
  flags?: MPTokenIssuanceCreateFlags;
}

export interface MPTokenIssuanceDestroyRequest extends BaseTransactionRequest {
  // The ID of the MPToken issuance to destroy.
  MPTokenIssuanceID: string;
}

export interface MPTokenIssuanceSetRequest extends BaseTransactionRequest {
  // The ID of the MPToken issuance to modify.
  MPTokenIssuanceID: string;
  // The account to modify MPT holder status for.
  Holder?: string;
  // Flags to set on the transaction.
  flags?: MPTokenIssuanceSetFlags;
}

export interface MPTokenAuthorizeRequest extends BaseTransactionRequest {
  // The ID of the MPToken issuance.
  MPTokenIssuanceID: string;
  // The account to authorize or unauthorize.
  Holder?: string;
  // Flags to set on the transaction.
  flags?: MPTokenAuthorizeFlags;
}

/*
 * Automated Market Maker (AMM) Request Payloads
 */
export interface AMMCreateRequest extends BaseTransactionRequest {
  // The first asset in the AMM pool.
  Amount: Amount;
  // The second asset in the AMM pool.
  Amount2: Amount;
  // The trading fee for the AMM, in basis points (1/100th of a percent).
  TradingFee: number;
}

export interface AMMDeleteRequest extends BaseTransactionRequest {
  // The definition for one of the assets in the AMM pool.
  Asset: Currency;
  // The definition for the other asset in the AMM pool.
  Asset2: Currency;
}

export interface AMMDepositRequest extends BaseTransactionRequest {
  // The definition for one of the assets in the AMM pool.
  Asset: Currency;
  // The definition for the other asset in the AMM pool.
  Asset2: Currency;
  // The amount of one asset to deposit.
  Amount?: Amount;
  // The amount of the other asset to deposit.
  Amount2?: Amount;
  // The maximum effective price to pay.
  EPrice?: Amount;
  // The amount of LP tokens to receive.
  LPTokenOut?: IssuedCurrencyAmount;
  // Flags to set on the transaction.
  flags?: DepositAMMFlags;
}

export interface AMMWithdrawRequest extends BaseTransactionRequest {
  // The definition for one of the assets in the AMM pool.
  Asset: Currency;
  // The definition for the other asset in the AMM pool.
  Asset2: Currency;
  // The amount of one asset to withdraw.
  Amount?: Amount;
  // The amount of the other asset to withdraw.
  Amount2?: Amount;
  // The minimum effective price to receive.
  EPrice?: Amount;
  // The amount of LP tokens to redeem.
  LPTokenIn?: IssuedCurrencyAmount;
  // Flags to set on the transaction.
  flags?: WithdrawAMMFlags;
}

export interface AMMVoteRequest extends BaseTransactionRequest {
  // The definition for one of the assets in the AMM pool.
  Asset: Currency;
  // The definition for the other asset in the AMM pool.
  Asset2: Currency;
  // The proposed trading fee, in basis points (1/100th of a percent).
  TradingFee: number;
}

export interface AMMBidRequest extends BaseTransactionRequest {
  // The definition for one of the assets in the AMM pool.
  Asset: Currency;
  // The definition for the other asset in the AMM pool.
  Asset2: Currency;
  // The maximum bid price (LP tokens to pay).
  BidMax?: IssuedCurrencyAmount;
  // The minimum bid price (LP tokens to pay).
  BidMin?: IssuedCurrencyAmount;
  // A list of accounts to add to the auction slot's authorized accounts list.
  AuthAccounts?: AuthAccount[];
}

export interface AMMClawbackRequest extends BaseTransactionRequest {
  // The definition for the asset in the AMM pool (must be issued by this account).
  Asset: IssuedCurrency;
  // The definition for the other asset in the AMM pool.
  Asset2: Currency;
  // The account that holds the AMM LP tokens to clawback from.
  Holder: string;
  // The amount of the asset to clawback.
  Amount?: IssuedCurrencyAmount;
}

/*
 * Decentralized Identifiers (DID) Request Payloads
 */
export interface DIDSetRequest extends BaseTransactionRequest {
  // The DID document associated with this account.
  DIDDocument?: string;
  // The URI pointing to the DID document.
  URI?: string;
  // Additional data associated with the DID.
  Data?: string;
}

export interface DIDDeleteRequest extends BaseTransactionRequest {
  // No additional fields required - deletes DID associated with sending account.
}

/*
 * Credentials Request Payloads
 */
export interface CredentialCreateRequest extends BaseTransactionRequest {
  // The account that will hold the credential.
  Subject: string;
  // The type of credential.
  CredentialType: string;
  // The expiration time of the credential.
  Expiration?: number;
  // The URI pointing to the credential data.
  URI?: string;
}

export interface CredentialAcceptRequest extends BaseTransactionRequest {
  // The account that issued the credential.
  Issuer: string;
  // The type of credential to accept.
  CredentialType: string;
}

export interface CredentialDeleteRequest extends BaseTransactionRequest {
  // The account that holds the credential (for issuer-initiated delete) or the issuer (for holder-initiated delete).
  Subject?: string;
  // The account that issued the credential.
  Issuer?: string;
  // The type of credential to delete.
  CredentialType: string;
}

/*
 * Oracle Request Payloads
 */
export interface OracleSetRequest extends BaseTransactionRequest {
  // The Oracle Document ID.
  OracleDocumentID: number;
  // The provider of the oracle data.
  Provider?: string;
  // The URI pointing to the oracle data.
  URI?: string;
  // The asset class of the oracle.
  AssetClass?: string;
  // The time the oracle data was last updated.
  LastUpdateTime: number;
  // The price data entries.
  PriceDataSeries: PriceData[];
}

export interface OracleDeleteRequest extends BaseTransactionRequest {
  // The Oracle Document ID to delete.
  OracleDocumentID: number;
}

/*
 * Permissioned Domains Request Payloads
 */
export interface PermissionedDomainSetRequest extends BaseTransactionRequest {
  // The domain's unique identifier.
  DomainID?: string;
  // The credentials accepted by this domain.
  AcceptedCredentials?: Array<{
    Credential: {
      Issuer: string;
      CredentialType: string;
    };
  }>;
}

export interface PermissionedDomainDeleteRequest extends BaseTransactionRequest {
  // The domain's unique identifier.
  DomainID: string;
}

/*
 * Other Transaction Request Payloads
 */
export interface ClawbackRequest extends BaseTransactionRequest {
  // The amount to claw back.
  Amount: Amount;
  // The holder to claw back from.
  Holder?: string;
}

export interface NFTokenModifyRequest extends BaseTransactionRequest {
  // The NFToken ID to modify.
  NFTokenID: string;
  // The new owner of the NFToken.
  Owner?: string;
  // The new URI for the NFToken.
  URI?: string;
}

export interface DelegateSetRequest extends BaseTransactionRequest {
  // The account to delegate to.
  Authorize?: string;
  // Granular permissions to delegate.
  Permissions?: Array<{
    Permission: {
      PermissionValue: string;
    };
  }>;
}

export interface BatchRequest extends BaseTransactionRequest {
  // The raw transactions to batch.
  RawTransactions: Array<{
    RawTransaction: SubmittableTransaction;
  }>;
  // Flags to set on the batch transaction.
  flags?: number;
}

export interface LedgerStateFixRequest extends BaseTransactionRequest {
  // The type of fix to apply.
  LedgerFixType: number;
  // The owner of the ledger entry to fix.
  Owner?: string;
}

/*
 * Escrow Request Payloads
 */
export interface EscrowCreateRequest extends BaseTransactionRequest {
  // Amount of XRP, in drops, to deduct from the sender's balance and escrow.
  // Once escrowed, the XRP can either go to the Destination address (after the FinishAfter time)
  // or returned to the sender (after the CancelAfter time).
  amount: Amount;
  // Address to receive escrowed XRP.
  destination: string;
  // The time, in seconds since the Ripple Epoch, when this escrow expires.
  // This value is immutable; the funds can only be returned to the sender after this time.
  cancelAfter?: number;
  // The time, in seconds since the Ripple Epoch, when the escrowed XRP can be released to the recipient.
  // This value is immutable; the funds cannot move until this time is reached.
  finishAfter?: number;
  // Hex value representing a PREIMAGE-SHA-256 crypto-condition.
  // The funds can only be delivered to the recipient if this condition is fulfilled.
  condition?: string;
  // Arbitrary tag to further specify the destination for this escrowed payment,
  // such as a hosted recipient at the destination address.
  destinationTag?: number;
}

export interface EscrowFinishRequest extends BaseTransactionRequest {
  // Address of the source account that funded the escrow payment.
  owner: string;
  // Transaction sequence (or Ticket number) of EscrowCreate transaction that created the escrow to finish.
  offerSequence: number;
  // Hex value representing a PREIMAGE-SHA-256 crypto-condition.
  condition?: string;
  // Hex value of the PREIMAGE-SHA-256 crypto-condition fulfillment matching the condition.
  fulfillment?: string;
}

export interface EscrowCancelRequest extends BaseTransactionRequest {
  // Address of the source account that funded the escrow payment.
  owner: string;
  // Transaction sequence (or Ticket number) of EscrowCreate transaction that created the escrow to cancel.
  offerSequence: number;
}

/*
 * Check Request Payloads
 */
export interface CheckCreateRequest extends BaseTransactionRequest {
  // The unique address of the account that can cash the Check.
  destination: string;
  // Maximum amount of source currency the Check is allowed to debit the sender,
  // including transfer fees on non-XRP currencies.
  sendMax: Amount;
  // Arbitrary tag that identifies the reason for the Check, or a hosted recipient to pay.
  destinationTag?: number;
  // Time after which the Check is no longer valid, in seconds since the Ripple Epoch.
  expiration?: number;
  // Arbitrary 256-bit hash representing a specific reason or identifier for this Check.
  invoiceID?: string;
}

export interface CheckCashRequest extends BaseTransactionRequest {
  // The ID of the Check ledger object to cash, as a 64-character hexadecimal string.
  checkID: string;
  // Redeem the Check for exactly this amount, if possible.
  // The currency must match that of the SendMax of the corresponding CheckCreate transaction.
  // You must provide either this field or deliverMin.
  amount?: Amount;
  // Redeem the Check for at least this amount and for as much as possible.
  // The currency must match that of the SendMax of the corresponding CheckCreate transaction.
  // You must provide either this field or amount.
  deliverMin?: Amount;
}

export interface CheckCancelRequest extends BaseTransactionRequest {
  // The ID of the Check ledger object to cancel, as a 64-character hexadecimal string.
  checkID: string;
}

/*
 * Payment Channel Request Payloads
 */
export interface PaymentChannelCreateRequest extends BaseTransactionRequest {
  // Amount of XRP, in drops, to deduct from the sender's balance and set aside in this channel.
  // While the channel is open, the XRP can only go to the Destination address.
  // Note: Payment Channels only support XRP, not IOUs.
  amount: string;
  // Address to receive XRP claims against this channel.
  destination: string;
  // Amount of time the source address must wait before closing the channel if it has unclaimed XRP.
  settleDelay: number;
  // The 33-byte public key of the key pair the source will use to sign claims against this channel,
  // in hexadecimal. This can be any secp256k1 or Ed25519 public key.
  publicKey: string;
  // The time, in seconds since the Ripple Epoch, when this channel expires.
  // Any transaction that would modify the channel after this time closes the channel without otherwise affecting it.
  cancelAfter?: number;
  // Arbitrary tag to further specify the destination for this payment channel.
  destinationTag?: number;
}

export interface PaymentChannelClaimRequest extends BaseTransactionRequest {
  // The unique ID of the channel, as a 64-character hexadecimal string.
  channel: string;
  // Total amount of XRP, in drops, delivered by this channel after processing this claim.
  // Required to deliver XRP. Must be more than the total amount delivered by the channel so far,
  // but not greater than the Amount of the signed claim.
  // Note: Payment Channels only support XRP, not IOUs.
  balance?: string;
  // The amount of XRP, in drops, authorized by the Signature.
  // This must match the amount in the signed message.
  // Note: Payment Channels only support XRP, not IOUs.
  amount?: string;
  // The signature of this claim, as hexadecimal.
  // The signed message contains the channel ID and the amount of the claim.
  signature?: string;
  // The public key used for the signature, as hexadecimal.
  // This must match the PublicKey stored in the ledger for the channel.
  publicKey?: string;
  // (Optional) Bit-mask of flags for this transaction.
  flags?: PaymentChannelClaimFlags;
}

export interface PaymentChannelFundRequest extends BaseTransactionRequest {
  // The unique ID of the channel to fund, as a 64-character hexadecimal string.
  channel: string;
  // Amount of XRP, in drops, to add to the channel.
  // Note: Payment Channels only support XRP, not IOUs.
  amount: string;
  // New Expiration time to set for the channel, in seconds since the Ripple Epoch.
  // This must be later than either the current time plus the SettleDelay of the channel,
  // or the existing Expiration of the channel.
  expiration?: number;
}

export type PaymentChannelClaimFlags =
  | number
  | {
      // Request to close the channel.
      tfClose?: boolean;
      // Request to renew the channel by resetting the expiration.
      tfRenew?: boolean;
    };

export type RequestPayload =
  | AcceptNFTOfferRequest
  | BurnNFTRequest
  | CancelNFTOfferRequest
  | CancelOfferRequest
  | CreateNFTOfferRequest
  | CreateOfferRequest
  | GetNetworkRequest
  | GetNFTRequest
  | MintNFTRequest
  | WebsiteRequest
  | SendPaymentRequest
  | SendPaymentRequestDeprecated
  | SetAccountRequest
  | SetHookRequest
  | SetRegularKeyRequest
  | SetTrustlineRequest
  | SetTrustlineRequestDeprecated
  | SignMessageRequest
  | SignTransactionRequest
  | SubmitStorageKeyRequest
  | SubmitTransactionRequest
  | SubmitBulkTransactionsWithKeysRequest
  // MPT
  | MPTokenIssuanceCreateRequest
  | MPTokenIssuanceDestroyRequest
  | MPTokenIssuanceSetRequest
  | MPTokenAuthorizeRequest
  // AMM
  | AMMCreateRequest
  | AMMDeleteRequest
  | AMMDepositRequest
  | AMMWithdrawRequest
  | AMMVoteRequest
  | AMMBidRequest
  | AMMClawbackRequest
  // DID
  | DIDSetRequest
  | DIDDeleteRequest
  // Credentials
  | CredentialCreateRequest
  | CredentialAcceptRequest
  | CredentialDeleteRequest
  // Oracle
  | OracleSetRequest
  | OracleDeleteRequest
  // Permissioned Domains
  | PermissionedDomainSetRequest
  | PermissionedDomainDeleteRequest
  // Other
  | ClawbackRequest
  | NFTokenModifyRequest
  | DelegateSetRequest
  | BatchRequest
  | LedgerStateFixRequest
  // Escrow
  | EscrowCreateRequest
  | EscrowFinishRequest
  | EscrowCancelRequest
  // Check
  | CheckCreateRequest
  | CheckCashRequest
  | CheckCancelRequest
  // Payment Channel
  | PaymentChannelCreateRequest
  | PaymentChannelClaimRequest
  | PaymentChannelFundRequest;

/*
 * Response Payloads
 */
export const enum ResponseType {
  Response = 'response',
  Reject = 'reject'
}

interface BaseResponse<T> {
  type: ResponseType;
  result?: T;
}

export interface GetNetworkResponse
  extends BaseResponse<{
    chain: string;
    network: Network;
    websocket: string;
  }> {}

export interface GetNetworkResponseDeprecated {
  network: Network | undefined;
}

export interface GetAddressResponse extends BaseResponse<{ address: string }> {}

export interface GetAddressResponseDeprecated {
  publicAddress: string | null | undefined;
}

export interface GetPublicKeyResponse
  extends BaseResponse<{ address: string; publicKey: string }> {}

export interface GetPublicKeyResponseDeprecated {
  address: string | null | undefined;
  publicKey: string | null | undefined;
}

export interface SignMessageResponse extends BaseResponse<{ signedMessage: string }> {}

export interface SignMessageResponseDeprecated {
  signedMessage: string | null | undefined;
}

export interface SubmitTransactionResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface SignTransactionResponse
  extends BaseResponse<{
    signature: string | null | undefined;
  }> {}

export type TransactionBulkResponse = {
  // The custom ID of the transaction, if it was set in the request.
  id?: string;
  // Whether the transaction was accepted by the XRPL network (waitForHashes = false only).
  accepted?: boolean;
  // The hash of the transaction (waitForHashes = true only).
  hash?: string;
  // The error message, if the transaction was rejected.
  error?: string;
};

export interface SubmitBulkTransactionsResponse
  extends BaseResponse<{
    transactions: TransactionBulkResponse[];
  }> {}

export interface IsInstalledResponse {
  result: { isInstalled: boolean };
}

export interface SendPaymentResponse extends BaseResponse<{ hash: string }> {}

export interface SendPaymentResponseDeprecated {
  hash: string | null | undefined;
}

export interface SetTrustlineResponse extends BaseResponse<{ hash: string }> {}

export interface SetTrustlineResponseDeprecated {
  hash: string | null | undefined;
}

export interface GetNFTResponse extends BaseResponse<AccountNFTokenResponse> {}

export interface GetNFTResponseDeprecated {
  nfts: AccountNFToken[] | null | undefined;
}

export interface MintNFTResponse extends BaseResponse<NFTokenIDResponse> {}

export interface CreateNFTOfferResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CancelNFTOfferResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AcceptNFTOfferResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface BurnNFTResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface SetAccountResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface SetRegularKeyResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CreateOfferResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CancelOfferResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface SetHookResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// MPT Response Interfaces
export interface MPTokenIssuanceCreateResponse
  extends BaseResponse<{
    hash: string;
    MPTokenIssuanceID?: string;
  }> {}

export interface MPTokenIssuanceDestroyResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface MPTokenIssuanceSetResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface MPTokenAuthorizeResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// AMM Response Interfaces
export interface AMMCreateResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AMMDeleteResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AMMDepositResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AMMWithdrawResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AMMVoteResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AMMBidResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface AMMClawbackResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// DID Response Interfaces
export interface DIDSetResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface DIDDeleteResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Credential Response Interfaces
export interface CredentialCreateResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CredentialAcceptResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CredentialDeleteResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Oracle Response Interfaces
export interface OracleSetResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface OracleDeleteResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Permissioned Domain Response Interfaces
export interface PermissionedDomainSetResponse
  extends BaseResponse<{
    hash: string;
    DomainID?: string;
  }> {}

export interface PermissionedDomainDeleteResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Other Response Interfaces
export interface ClawbackResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface NFTokenModifyResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface DelegateSetResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface BatchResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface LedgerStateFixResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Escrow Response Interfaces
export interface EscrowCreateResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface EscrowFinishResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface EscrowCancelResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Check Response Interfaces
export interface CheckCreateResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CheckCashResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface CheckCancelResponse
  extends BaseResponse<{
    hash: string;
  }> {}

// Payment Channel Response Interfaces
export interface PaymentChannelCreateResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface PaymentChannelClaimResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export interface PaymentChannelFundResponse
  extends BaseResponse<{
    hash: string;
  }> {}

export type ResponsePayload =
  | AcceptNFTOfferResponse
  | BurnNFTResponse
  | CancelNFTOfferResponse
  | CancelOfferResponse
  | CreateNFTOfferResponse
  | CreateOfferResponse
  | GetAddressResponse
  | GetAddressResponseDeprecated
  | GetNFTResponse
  | GetNFTResponseDeprecated
  | GetNetworkResponse
  | GetNetworkResponseDeprecated
  | GetPublicKeyResponse
  | GetPublicKeyResponseDeprecated
  | IsInstalledResponse
  | MintNFTResponse
  | SendPaymentResponse
  | SendPaymentResponseDeprecated
  | SetAccountResponse
  | SetHookResponse
  | SetRegularKeyResponse
  | SetTrustlineResponse
  | SetTrustlineResponseDeprecated
  | SignMessageResponse
  | SignMessageResponseDeprecated
  | SubmitTransactionResponse
  | SubmitBulkTransactionsResponse
  // MPT
  | MPTokenIssuanceCreateResponse
  | MPTokenIssuanceDestroyResponse
  | MPTokenIssuanceSetResponse
  | MPTokenAuthorizeResponse
  // AMM
  | AMMCreateResponse
  | AMMDeleteResponse
  | AMMDepositResponse
  | AMMWithdrawResponse
  | AMMVoteResponse
  | AMMBidResponse
  | AMMClawbackResponse
  // DID
  | DIDSetResponse
  | DIDDeleteResponse
  // Credentials
  | CredentialCreateResponse
  | CredentialAcceptResponse
  | CredentialDeleteResponse
  // Oracle
  | OracleSetResponse
  | OracleDeleteResponse
  // Permissioned Domains
  | PermissionedDomainSetResponse
  | PermissionedDomainDeleteResponse
  // Other
  | ClawbackResponse
  | NFTokenModifyResponse
  | DelegateSetResponse
  | BatchResponse
  | LedgerStateFixResponse
  // Escrow
  | EscrowCreateResponse
  | EscrowFinishResponse
  | EscrowCancelResponse
  // Check
  | CheckCreateResponse
  | CheckCashResponse
  | CheckCancelResponse
  // Payment Channel
  | PaymentChannelCreateResponse
  | PaymentChannelClaimResponse
  | PaymentChannelFundResponse;

/*
 * Internal Messages Payloads
 */
export interface PasswordInternalResponse {
  password: string;
}

/*
 * Events Payloads
 */
interface BaseEventResponse<T> {
  result: T;
}

export interface EventNetworkChangedResponse
  extends BaseEventResponse<{
    network: {
      name: string;
      server: string;
      description: string;
    };
  }> {}

export interface EventWalletChangedResponse
  extends BaseEventResponse<{
    wallet: {
      publicAddress: string;
    };
  }> {}

export interface EventLoginResponse extends BaseEventResponse<{ loggedIn: boolean }> {}

export interface EventLogoutResponse extends BaseEventResponse<{ loggedIn: boolean }> {}
