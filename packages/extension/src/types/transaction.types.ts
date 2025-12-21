export enum TransactionStatus {
  // waiting: waiting for a user interaction
  Waiting = 'WAITING',
  // pending: transaction is pending to be a success or rejected (in progress)
  Pending = 'PENDING',
  // success: transaction has been successful
  Success = 'SUCCESS',
  // rejected: transaction has been rejected
  Rejected = 'REJECTED'
}

export enum TransactionTypes {
  AccountDelete = 'AccountDelete',
  AccountSet = 'AccountSet',
  CheckCancel = 'CheckCancel',
  CheckCash = 'CheckCash',
  CheckCreate = 'CheckCreate',
  DepositPreauth = 'DepositPreauth',
  EscrowCancel = 'EscrowCancel',
  EscrowCreate = 'EscrowCreate',
  EscrowFinish = 'EscrowFinish',
  NFTokenAcceptOffer = 'NFTokenAcceptOffer',
  NFTokenBurn = 'NFTokenBurn',
  NFTokenCancelOffer = 'NFTokenCancelOffer',
  NFTokenCreateOffer = 'NFTokenCreateOffer',
  NFTokenMint = 'NFTokenMint',
  NFTokenModify = 'NFTokenModify',
  OfferCancel = 'OfferCancel',
  OfferCreate = 'OfferCreate',
  Payment = 'Payment',
  PaymentChannelAuthorize = 'PaymentChannelAuthorize',
  PaymentChannelClaim = 'PaymentChannelClaim',
  PaymentChannelCreate = 'PaymentChannelCreate',
  PaymentChannelFund = 'PaymentChannelFund',
  SetRegularKey = 'SetRegularKey',
  SignerListSet = 'SignerListSet',
  TicketCreate = 'TicketCreate',
  TrustSet = 'TrustSet',
  // Multi-Purpose Tokens (MPT)
  MPTokenIssuanceCreate = 'MPTokenIssuanceCreate',
  MPTokenIssuanceDestroy = 'MPTokenIssuanceDestroy',
  MPTokenIssuanceSet = 'MPTokenIssuanceSet',
  MPTokenAuthorize = 'MPTokenAuthorize',
  // Automated Market Makers (AMM)
  AMMCreate = 'AMMCreate',
  AMMDelete = 'AMMDelete',
  AMMDeposit = 'AMMDeposit',
  AMMWithdraw = 'AMMWithdraw',
  AMMVote = 'AMMVote',
  AMMBid = 'AMMBid',
  AMMClawback = 'AMMClawback',
  // Decentralized Identifiers (DID)
  DIDSet = 'DIDSet',
  DIDDelete = 'DIDDelete',
  // Credentials
  CredentialCreate = 'CredentialCreate',
  CredentialAccept = 'CredentialAccept',
  CredentialDelete = 'CredentialDelete',
  // Price Oracles
  OracleSet = 'OracleSet',
  OracleDelete = 'OracleDelete',
  // Permissioned Domains
  PermissionedDomainSet = 'PermissionedDomainSet',
  PermissionedDomainDelete = 'PermissionedDomainDelete',
  // Other
  Clawback = 'Clawback',
  DelegateSet = 'DelegateSet',
  Batch = 'Batch',
  LedgerStateFix = 'LedgerStateFix'
}
