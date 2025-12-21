import { unix } from 'dayjs';
import { AccountTxTransaction, DepositPreauth, Payment, SetRegularKey, RIPPLED_API_V1 } from 'xrpl';

import { TransactionTypes } from '../../../types';
import { formatAmount } from '../../../utils';

// Use V1 API type for backward compatibility (uses `tx` field instead of `tx_json`)
type AccountTxTransactionV1 = AccountTxTransaction<typeof RIPPLED_API_V1>;

export const formatDate = (unixTimestamp: number): string => {
  return unix(946684800 + unixTimestamp).format('MMM DD, YYYY - HH:mm');
};

type TransactionFormatter = (
  transaction: AccountTxTransactionV1,
  publicAddress: string,
  mainToken: string
) => string;

const transactionMappers: Partial<Record<TransactionTypes, TransactionFormatter>> = {
  [TransactionTypes.Payment]: (transaction, publicAddress, mainToken) => {
    const amount = formatAmount((transaction.tx as Payment).Amount, mainToken);
    return (transaction.tx as Payment).Destination === publicAddress
      ? `Payment received - ${amount}`
      : `Payment sent - ${amount}`;
  },
  [TransactionTypes.TrustSet]: () => 'TrustLine transaction',
  [TransactionTypes.EscrowCreate]: () => 'Create escrow',
  [TransactionTypes.EscrowFinish]: () => 'Finish escrow',
  [TransactionTypes.EscrowCancel]: () => 'Cancel escrow',
  [TransactionTypes.AccountSet]: () => 'Edit account',
  [TransactionTypes.SignerListSet]: () => 'Set Signer List',
  [TransactionTypes.OfferCreate]: () => 'Create offer',
  [TransactionTypes.OfferCancel]: () => 'Cancel offer',
  [TransactionTypes.AccountDelete]: () => 'Delete Account',
  [TransactionTypes.SetRegularKey]: (transaction) => {
    if ((transaction.tx as SetRegularKey).RegularKey) {
      return 'Set Regular Key';
    }
    return 'Remove Regular Key';
  },
  [TransactionTypes.DepositPreauth]: (transaction) => {
    if ((transaction.tx as DepositPreauth).Authorize) {
      return 'Authorize Deposit';
    }
    return 'Unauthorize Deposit';
  },
  [TransactionTypes.CheckCreate]: () => 'Create check',
  [TransactionTypes.CheckCash]: () => 'Cash check',
  [TransactionTypes.CheckCancel]: () => 'Cancel check',
  [TransactionTypes.TicketCreate]: () => 'Create ticket',
  [TransactionTypes.PaymentChannelAuthorize]: () => 'Authorize payment channel',
  [TransactionTypes.PaymentChannelCreate]: () => 'Create payment channel',
  [TransactionTypes.PaymentChannelClaim]: () => 'Claim payment channel',
  [TransactionTypes.PaymentChannelFund]: () => 'Fund payment channel',
  [TransactionTypes.NFTokenMint]: () => 'Mint NFT',
  [TransactionTypes.NFTokenBurn]: () => 'Burn NFT',
  [TransactionTypes.NFTokenCreateOffer]: () => 'Create NFT offer',
  [TransactionTypes.NFTokenCancelOffer]: () => 'Cancel NFT offer',
  [TransactionTypes.NFTokenAcceptOffer]: () => 'Accept NFT offer',
  [TransactionTypes.NFTokenModify]: () => 'Modify NFT',
  // Multi-Purpose Tokens (MPT)
  [TransactionTypes.MPTokenIssuanceCreate]: () => 'Create MPT issuance',
  [TransactionTypes.MPTokenIssuanceDestroy]: () => 'Destroy MPT issuance',
  [TransactionTypes.MPTokenIssuanceSet]: () => 'Set MPT issuance',
  [TransactionTypes.MPTokenAuthorize]: () => 'Authorize MPT',
  // Automated Market Makers (AMM)
  [TransactionTypes.AMMCreate]: () => 'Create AMM',
  [TransactionTypes.AMMDelete]: () => 'Delete AMM',
  [TransactionTypes.AMMDeposit]: () => 'AMM deposit',
  [TransactionTypes.AMMWithdraw]: () => 'AMM withdraw',
  [TransactionTypes.AMMVote]: () => 'AMM vote',
  [TransactionTypes.AMMBid]: () => 'AMM bid',
  [TransactionTypes.AMMClawback]: () => 'AMM clawback',
  // Decentralized Identifiers (DID)
  [TransactionTypes.DIDSet]: () => 'Set DID',
  [TransactionTypes.DIDDelete]: () => 'Delete DID',
  // Credentials
  [TransactionTypes.CredentialCreate]: () => 'Create credential',
  [TransactionTypes.CredentialAccept]: () => 'Accept credential',
  [TransactionTypes.CredentialDelete]: () => 'Delete credential',
  // Price Oracles
  [TransactionTypes.OracleSet]: () => 'Set oracle',
  [TransactionTypes.OracleDelete]: () => 'Delete oracle',
  // Permissioned Domains
  [TransactionTypes.PermissionedDomainSet]: () => 'Set permissioned domain',
  [TransactionTypes.PermissionedDomainDelete]: () => 'Delete permissioned domain',
  // Other
  [TransactionTypes.Clawback]: () => 'Clawback',
  [TransactionTypes.DelegateSet]: () => 'Set delegate',
  [TransactionTypes.Batch]: () => 'Batch transaction',
  [TransactionTypes.LedgerStateFix]: () => 'Ledger state fix'
};

export const formatTransaction = (
  transaction: AccountTxTransactionV1,
  publicAddress: string,
  mainToken: string
): string => {
  if (!transaction.tx) {
    return 'Unsupported transaction';
  }

  const txType = transaction.tx.TransactionType;
  const formatter = transactionMappers[txType as keyof typeof transactionMappers];

  // If formatter doesn't exist for this txType, return the txType as default message
  return formatter ? formatter(transaction, publicAddress, mainToken) : txType;
};
