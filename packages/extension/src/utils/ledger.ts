/**
 * Ledger Hardware Wallet Utilities
 * Adapted from @xrpl-connect/adapter-ledger
 */
import type Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Xrp from '@ledgerhq/hw-app-xrp';

/**
 * Ledger device connection states
 */
export enum LedgerDeviceState {
  /** Device is not connected via USB */
  NOT_CONNECTED = 'NOT_CONNECTED',
  /** Device is connected but locked (PIN required) */
  LOCKED = 'LOCKED',
  /** Device is unlocked but XRP app is not open */
  APP_NOT_OPEN = 'APP_NOT_OPEN',
  /** Device is ready (unlocked and XRP app open) */
  READY = 'READY',
  /** Unknown state or error */
  UNKNOWN = 'UNKNOWN'
}

/**
 * User-friendly messages for each device state
 */
export const LEDGER_STATE_MESSAGES: Record<LedgerDeviceState, string> = {
  [LedgerDeviceState.NOT_CONNECTED]: 'Please connect your Ledger device via USB',
  [LedgerDeviceState.LOCKED]: 'Please unlock your Ledger device by entering your PIN',
  [LedgerDeviceState.APP_NOT_OPEN]: 'Please open the XRP application on your Ledger device',
  [LedgerDeviceState.READY]: 'Ledger device connected and ready',
  [LedgerDeviceState.UNKNOWN]: 'Unable to determine Ledger device state'
};

/**
 * Ledger error codes
 */
export enum LedgerErrorCode {
  /** Device is locked - user needs to enter PIN */
  DEVICE_LOCKED = 0x6804,
  /** App is not open or CLA not supported */
  APP_NOT_OPEN = 0x6e00,
  /** App is not open (alternative code) */
  APP_NOT_OPEN_ALT = 0x6511,
  /** App is not open (another alternative code) */
  APP_NOT_OPEN_ALT2 = 0x650f,
  /** User rejected the operation on device */
  USER_REJECTED = 0x6985,
  /** Invalid data provided */
  INVALID_DATA = 0x6a80,
  /** Wrong parameters */
  WRONG_PARAMETERS = 0x6b00,
  /** Technical problem on device */
  TECHNICAL_PROBLEM = 0x6f00
}

/**
 * Ledger account information
 */
export interface LedgerAccount {
  address: string;
  publicKey: string;
  path: string;
  index: number;
}

/**
 * Default timeout for Ledger operations (2 minutes as per requirements)
 */
export const DEFAULT_LEDGER_TIMEOUT = 120000; // 2 minutes

/**
 * Parse Ledger error and determine device state
 */
export function parseLedgerError(error: unknown): {
  state: LedgerDeviceState;
  message: string;
} {
  if (error && typeof error === 'object') {
    const err = error as any;

    // Check for status code
    if ('statusCode' in err) {
      const statusCode = err.statusCode;

      switch (statusCode) {
        case LedgerErrorCode.DEVICE_LOCKED:
          return {
            state: LedgerDeviceState.LOCKED,
            message: LEDGER_STATE_MESSAGES[LedgerDeviceState.LOCKED]
          };

        case LedgerErrorCode.APP_NOT_OPEN:
        case LedgerErrorCode.APP_NOT_OPEN_ALT:
        case LedgerErrorCode.APP_NOT_OPEN_ALT2:
          return {
            state: LedgerDeviceState.APP_NOT_OPEN,
            message: LEDGER_STATE_MESSAGES[LedgerDeviceState.APP_NOT_OPEN]
          };

        case LedgerErrorCode.USER_REJECTED:
          return {
            state: LedgerDeviceState.READY,
            message: 'Transaction rejected on Ledger device'
          };
      }
    }

    // Check error message
    if ('message' in err && typeof err.message === 'string') {
      const message = err.message.toLowerCase();

      if (
        message.includes('no device') ||
        message.includes('not found') ||
        message.includes('cannot open device') ||
        message.includes('disconnected')
      ) {
        return {
          state: LedgerDeviceState.NOT_CONNECTED,
          message: LEDGER_STATE_MESSAGES[LedgerDeviceState.NOT_CONNECTED]
        };
      }

      if (message.includes('locked')) {
        return {
          state: LedgerDeviceState.LOCKED,
          message: LEDGER_STATE_MESSAGES[LedgerDeviceState.LOCKED]
        };
      }

      if (message.includes('rejected') || message.includes('denied')) {
        return {
          state: LedgerDeviceState.READY,
          message: 'Operation rejected on Ledger device'
        };
      }
    }
  }

  return {
    state: LedgerDeviceState.UNKNOWN,
    message: error instanceof Error ? error.message : 'Unknown Ledger error'
  };
}

/**
 * Check if browser supports Ledger (WebHID or WebUSB)
 */
export function isBrowserSupported(): {
  supported: boolean;
  webHID: boolean;
  webUSB: boolean;
  message?: string;
} {
  const webHID = typeof navigator !== 'undefined' && 'hid' in navigator;
  const webUSB = typeof navigator !== 'undefined' && 'usb' in navigator;

  if (!webHID && !webUSB) {
    return {
      supported: false,
      webHID: false,
      webUSB: false,
      message: 'Your browser does not support WebHID or WebUSB. Please use Chrome, Edge, or Opera.'
    };
  }

  return {
    supported: true,
    webHID,
    webUSB
  };
}

/**
 * Create transport (WebUSB only for browser extension compatibility)
 */
export async function createLedgerTransport(): Promise<Transport> {
  const browserSupport = isBrowserSupported();

  console.log('Browser support:', browserSupport);

  if (!browserSupport.supported) {
    throw new Error(
      browserSupport.message || 'Browser does not support Ledger hardware wallets'
    );
  }

  // Try WebHID first (better compatibility with Chrome extensions)
  if (browserSupport.webHID) {
    console.log('Attempting WebHID connection...');
    try {
      const transport = await TransportWebHID.create();
      console.log('WebHID transport created successfully');
      return transport;
    } catch (error: any) {
      console.error('WebHID transport error:', error);
      console.warn('WebHID transport failed, trying WebUSB:', error);
      // Don't throw - fall through to WebUSB
    }
  }

  // Fallback to WebUSB if WebHID not available or failed
  if (browserSupport.webUSB) {
    console.log('Attempting WebUSB connection...');
    try {
      const transport = await TransportWebUSB.create();
      console.log('WebUSB transport created successfully');
      return transport;
    } catch (error: any) {
      console.error('WebUSB transport error:', error);
      throw error;
    }
  }

  throw new Error('No compatible transport available for Ledger device. Please use Chrome, Edge, or Opera browser.');
}

/**
 * Get device state
 */
export async function getLedgerDeviceState(derivationPath: string = "44'/144'/0'/0/0"): Promise<LedgerDeviceState> {
  try {
    const transport = await createLedgerTransport();
    const xrpApp = new Xrp(transport);
    await xrpApp.getAddress(derivationPath, false, false);
    await transport.close();
    return LedgerDeviceState.READY;
  } catch (error) {
    const { state } = parseLedgerError(error);
    return state;
  }
}

/**
 * Get multiple accounts from Ledger device
 * Useful for account selection UI
 */
export async function getLedgerAccounts(
  count: number = 5,
  startIndex: number = 0,
  timeout: number = DEFAULT_LEDGER_TIMEOUT
): Promise<LedgerAccount[]> {
  let transport: Transport | null = null;

  try {
    transport = await createLedgerTransport();
    const xrpApp = new Xrp(transport);
    const accounts: LedgerAccount[] = [];

    for (let i = 0; i < count; i++) {
      const accountIndex = startIndex + i;
      const path = `44'/144'/${accountIndex}'/0/0`;

      try {
        const result = await withTimeout(
          xrpApp.getAddress(path, false, false),
          timeout,
          `Timeout retrieving account ${accountIndex}`
        );

        accounts.push({
          address: result.address,
          publicKey: result.publicKey,
          path,
          index: accountIndex
        });
      } catch (error) {
        console.warn(`Failed to get account at index ${accountIndex}:`, error);
        // Continue to next account
      }
    }

    await transport.close();
    return accounts;
  } catch (error) {
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        console.warn('Error closing transport:', e);
      }
    }
    throw error;
  }
}

/**
 * Progress callback for Ledger signing operations
 */
export type LedgerSigningProgressCallback = (step: 'preparing' | 'waiting' | 'signing') => void;

/**
 * Sign transaction with Ledger device
 */
export async function signTransactionWithLedger(
  derivationPath: string,
  txBlob: string,
  timeout: number = DEFAULT_LEDGER_TIMEOUT,
  onProgress?: LedgerSigningProgressCallback
): Promise<string> {
  let transport: Transport | null = null;

  try {
    onProgress?.('preparing');
    transport = await createLedgerTransport();
    const xrpApp = new Xrp(transport);

    onProgress?.('waiting');
    const signature = await withTimeout(
      (async () => {
        onProgress?.('signing');
        return await xrpApp.signTransaction(derivationPath, txBlob);
      })(),
      timeout,
      'Signing timeout. Please confirm the transaction on your Ledger device.'
    );

    await transport.close();

    if (!signature) {
      throw new Error('Failed to sign transaction with Ledger');
    }

    return signature.toUpperCase();
  } catch (error) {
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        console.warn('Error closing transport:', e);
      }
    }

    const { state, message } = parseLedgerError(error);

    if (state === LedgerDeviceState.READY && message.includes('rejected')) {
      throw new Error('Transaction rejected on Ledger device');
    }

    throw new Error(message || 'Failed to sign transaction with Ledger device');
  }
}

/**
 * Sign message with Ledger device
 */
export async function signMessageWithLedger(
  derivationPath: string,
  message: string,
  timeout: number = DEFAULT_LEDGER_TIMEOUT
): Promise<string> {
  let transport: Transport | null = null;

  try {
    transport = await createLedgerTransport();
    const xrpApp = new Xrp(transport);

    // Convert message to hex
    const messageHex = Array.from(new TextEncoder().encode(message))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const signature = await withTimeout(
      xrpApp.signTransaction(derivationPath, messageHex),
      timeout,
      'Signing timeout. Please confirm the message on your Ledger device.'
    );

    await transport.close();

    if (!signature) {
      throw new Error('Failed to sign message with Ledger');
    }

    return signature;
  } catch (error) {
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        console.warn('Error closing transport:', e);
      }
    }

    const { message: errorMessage } = parseLedgerError(error);
    throw new Error(errorMessage || 'Failed to sign message with Ledger device');
  }
}

/**
 * Wrap promise with timeout
 */
function withTimeout<T>(promise: Promise<T>, timeout: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeout)
    )
  ]);
}
