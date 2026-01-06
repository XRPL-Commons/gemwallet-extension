import { ECDSA, Wallet as WalletXRPL } from 'xrpl';

export type WalletType = 'software' | 'ledger';

export interface Wallet {
  name: string;
  publicAddress: string;
  seed?: string;
  mnemonic?: string;
  algorithm?: ECDSA;
  type?: WalletType;
  derivationPath?: string;
  publicKey?: string; // For Ledger wallets
}

export interface WalletLedger extends Wallet {
  wallet: WalletXRPL;
}
