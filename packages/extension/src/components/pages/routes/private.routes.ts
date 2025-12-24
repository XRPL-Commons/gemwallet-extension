import {
  ABOUT_PATH,
  ACCEPT_NFT_OFFER_PATH,
  ADD_MPTOKEN_PATH,
  ADD_NEW_TRUSTLINE_PATH,
  ADD_NEW_WALLET_PATH,
  AMM_BID_PATH,
  AMM_CLAWBACK_PATH,
  AMM_CREATE_PATH,
  AMM_DELETE_PATH,
  AMM_DEPOSIT_PATH,
  AMM_VOTE_PATH,
  AMM_WITHDRAW_PATH,
  SUBMIT_RAW_TRANSACTION_PATH,
  BURN_NFT_PATH,
  CANCEL_NFT_OFFER_PATH,
  CANCEL_OFFER_PATH,
  CHECK_CANCEL_PATH,
  CHECK_CASH_PATH,
  CHECK_CREATE_FORM_PATH,
  CHECK_CREATE_PATH,
  CHECKS_PATH,
  CREATE_NFT_OFFER_PATH,
  CREATE_OFFER_PATH,
  DELETE_ACCOUNT_PATH,
  DID_DELETE_PATH,
  DID_PATH,
  DID_SET_FORM_PATH,
  DID_SET_PATH,
  EDIT_WALLET_PATH,
  ESCROW_CANCEL_PATH,
  ESCROW_CREATE_FORM_PATH,
  ESCROW_CREATE_PATH,
  ESCROW_FINISH_PATH,
  ESCROW_PATH,
  HISTORY_PATH,
  HOME_PATH,
  LIST_WALLETS_PATH,
  MINT_NFT_PATH,
  MPTOKEN_REMOVE_PATH,
  NFT_VIEWER_PATH,
  PASSKEY_SETUP_PATH,
  PAYMENT_CHANNEL_CLAIM_PATH,
  PAYMENT_CHANNEL_CREATE_FORM_PATH,
  PAYMENT_CHANNEL_CREATE_PATH,
  PAYMENT_CHANNEL_FUND_PATH,
  PAYMENT_CHANNELS_PATH,
  PERMISSIONS_PATH,
  RECEIVE_PATH,
  SEND_PATH,
  SETTINGS_PATH,
  SET_ACCOUNT_PATH,
  SET_HOOK_PATH,
  SET_REGULAR_KEY_PATH,
  SHARE_NFT_PATH,
  SHARE_PUBLIC_ADDRESS_PATH,
  SHARE_PUBLIC_KEY_PATH,
  SIGN_MESSAGE_PATH,
  SIGN_TRANSACTION_PATH,
  SUBMIT_TRANSACTION_PATH,
  SUBMIT_TRANSACTIONS_BULK_PATH,
  SWAP_PATH,
  TRANSACTION_PATH,
  TRUSTED_APPS_PATH
} from '../../../constants';
import { About } from '../About';
import { AcceptNFTOffer } from '../AcceptNFTOffer';
import { AddMPToken } from '../AddMPToken';
import { AddNewTrustline } from '../AddNewTrustline';
import { AddNewWallet } from '../AddNewWallet';
import { AMMBid } from '../AMMBid';
import { AMMClawback } from '../AMMClawback';
import { AMMCreate } from '../AMMCreate';
import { AMMDelete } from '../AMMDelete';
import { AMMDeposit } from '../AMMDeposit';
import { AMMVote } from '../AMMVote';
import { AMMWithdraw } from '../AMMWithdraw';
import { BurnNFT } from '../BurnNFT';
import { CancelNFTOffer } from '../CancelNFTOffer';
import { CancelOffer } from '../CancelOffer';
import { CheckCancel } from '../CheckCancel';
import { CheckCash } from '../CheckCash';
import { CheckCreate } from '../CheckCreate';
import { CheckCreateForm } from '../CheckCreateForm';
import { Checks } from '../Checks';
import { CreateNFTOffer } from '../CreateNFTOffer';
import { CreateOffer } from '../CreateOffer';
import { DeleteAccount } from '../DeleteAccount';
import { DID } from '../DID';
import { DIDDelete } from '../DIDDelete';
import { DIDSet } from '../DIDSet';
import { DIDSetForm } from '../DIDSetForm';
import { EditWallet } from '../EditWallet';
import { Escrow } from '../Escrow';
import { EscrowCancel } from '../EscrowCancel';
import { EscrowCreate } from '../EscrowCreate';
import { EscrowCreateForm } from '../EscrowCreateForm';
import { EscrowFinish } from '../EscrowFinish';
import { History } from '../History';
import { Home } from '../Home';
import { ListWallets } from '../ListWallets';
import { MintNFT } from '../MintNFT';
import { MPTokenRemove } from '../MPTokenRemove';
import { NFTViewer } from '../NFTViewer';
import { PasskeySetup } from '../PasskeySetup';
import { PaymentChannelClaim } from '../PaymentChannelClaim';
import { PaymentChannelCreate } from '../PaymentChannelCreate';
import { PaymentChannelCreateForm } from '../PaymentChannelCreateForm';
import { PaymentChannelFund } from '../PaymentChannelFund';
import { PaymentChannels } from '../PaymentChannels';
import { Permissions } from '../Permissions';
import { ReceivePayment } from '../ReceivePayment';
import { SendPayment } from '../SendPayment';
import { SetAccount } from '../SetAccount';
import { SetHook } from '../SetHook';
import { SetRegularKey } from '../SetRegularKey';
import { Settings } from '../Settings';
import { ShareAddress } from '../ShareAddress';
import { ShareNFT } from '../ShareNFT';
import { SharePublicKey } from '../SharePublicKey';
import { SignMessage } from '../SignMessage';
import { SignTransaction } from '../SignTransaction';
import { SubmitBulkTransactions } from '../SubmitBulkTransactions';
import { SubmitRawTransaction } from '../SubmitRawTransaction';
import { SubmitTransaction } from '../SubmitTransaction';
import { Transaction } from '../Transaction';
import { TrustedApps } from '../TrustedApps';
import { Swap } from '../Swap';

type PrivateRouteConfig = {
  path: string;
  element: React.FC;
};

export const privateRoutes: PrivateRouteConfig[] = [
  { path: ABOUT_PATH, element: About },
  { path: ACCEPT_NFT_OFFER_PATH, element: AcceptNFTOffer },
  { path: ADD_NEW_TRUSTLINE_PATH, element: AddNewTrustline },
  { path: ADD_NEW_WALLET_PATH, element: AddNewWallet },
  // AMM Routes
  { path: AMM_BID_PATH, element: AMMBid },
  { path: AMM_CLAWBACK_PATH, element: AMMClawback },
  { path: AMM_CREATE_PATH, element: AMMCreate },
  { path: AMM_DELETE_PATH, element: AMMDelete },
  { path: AMM_DEPOSIT_PATH, element: AMMDeposit },
  { path: AMM_VOTE_PATH, element: AMMVote },
  { path: AMM_WITHDRAW_PATH, element: AMMWithdraw },
  { path: BURN_NFT_PATH, element: BurnNFT },
  { path: CANCEL_NFT_OFFER_PATH, element: CancelNFTOffer },
  { path: CANCEL_OFFER_PATH, element: CancelOffer },
  { path: CREATE_NFT_OFFER_PATH, element: CreateNFTOffer },
  { path: CREATE_OFFER_PATH, element: CreateOffer },
  { path: DELETE_ACCOUNT_PATH, element: DeleteAccount },
  // DID Routes
  { path: DID_PATH, element: DID },
  { path: DID_DELETE_PATH, element: DIDDelete },
  { path: DID_SET_PATH, element: DIDSet },
  { path: DID_SET_FORM_PATH, element: DIDSetForm },
  { path: EDIT_WALLET_PATH, element: EditWallet },
  // Escrow Routes
  { path: ESCROW_PATH, element: Escrow },
  { path: ESCROW_CANCEL_PATH, element: EscrowCancel },
  { path: ESCROW_CREATE_PATH, element: EscrowCreate },
  { path: ESCROW_CREATE_FORM_PATH, element: EscrowCreateForm },
  { path: ESCROW_FINISH_PATH, element: EscrowFinish },
  // Check Routes
  { path: CHECKS_PATH, element: Checks },
  { path: CHECK_CREATE_PATH, element: CheckCreate },
  { path: CHECK_CREATE_FORM_PATH, element: CheckCreateForm },
  { path: CHECK_CASH_PATH, element: CheckCash },
  { path: CHECK_CANCEL_PATH, element: CheckCancel },
  // Payment Channel Routes
  { path: PAYMENT_CHANNELS_PATH, element: PaymentChannels },
  { path: PAYMENT_CHANNEL_CREATE_PATH, element: PaymentChannelCreate },
  { path: PAYMENT_CHANNEL_CREATE_FORM_PATH, element: PaymentChannelCreateForm },
  { path: PAYMENT_CHANNEL_CLAIM_PATH, element: PaymentChannelClaim },
  { path: PAYMENT_CHANNEL_FUND_PATH, element: PaymentChannelFund },
  { path: HISTORY_PATH, element: History },
  { path: HOME_PATH, element: Home },
  { path: LIST_WALLETS_PATH, element: ListWallets },
  { path: MINT_NFT_PATH, element: MintNFT },
  // MPToken Routes
  { path: ADD_MPTOKEN_PATH, element: AddMPToken },
  { path: MPTOKEN_REMOVE_PATH, element: MPTokenRemove },
  { path: NFT_VIEWER_PATH, element: NFTViewer },
  // Passkey Route
  { path: PASSKEY_SETUP_PATH, element: PasskeySetup },
  { path: PERMISSIONS_PATH, element: Permissions },
  { path: RECEIVE_PATH, element: ReceivePayment },
  { path: SEND_PATH, element: SendPayment },
  { path: SET_ACCOUNT_PATH, element: SetAccount },
  { path: SET_HOOK_PATH, element: SetHook },
  { path: SET_REGULAR_KEY_PATH, element: SetRegularKey },
  { path: SETTINGS_PATH, element: Settings },
  { path: SHARE_NFT_PATH, element: ShareNFT },
  { path: SHARE_PUBLIC_ADDRESS_PATH, element: ShareAddress },
  { path: SHARE_PUBLIC_KEY_PATH, element: SharePublicKey },
  { path: SIGN_MESSAGE_PATH, element: SignMessage },
  { path: SIGN_TRANSACTION_PATH, element: SignTransaction },
  { path: SUBMIT_RAW_TRANSACTION_PATH, element: SubmitRawTransaction },
  { path: SUBMIT_TRANSACTION_PATH, element: SubmitTransaction },
  { path: SUBMIT_TRANSACTIONS_BULK_PATH, element: SubmitBulkTransactions },
  { path: TRANSACTION_PATH, element: Transaction },
  { path: TRUSTED_APPS_PATH, element: TrustedApps },
  // Swap Route
  { path: SWAP_PATH, element: Swap }
];
