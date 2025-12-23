import { Client } from 'xrpl';

export interface DIDObject {
  LedgerEntryType: 'DID';
  Account: string;
  DIDDocument?: string;
  Data?: string;
  URI?: string;
  Flags: number;
  OwnerNode: string;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  index: string;
}

export interface DIDDisplayData extends DIDObject {
  decodedDIDDocument?: string;
  decodedData?: string;
  decodedURI?: string;
}

/**
 * Decode hex string to UTF-8 string
 */
export const hexToString = (hex: string): string => {
  try {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    return new TextDecoder().decode(bytes);
  } catch {
    return hex;
  }
};

/**
 * Encode UTF-8 string to hex string
 */
export const stringToHex = (str: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

/**
 * Fetch DID object for an account
 */
export const fetchDID = async (client: Client, address: string): Promise<DIDObject | null> => {
  try {
    const response = await client.request({
      command: 'account_objects',
      account: address,
      ledger_index: 'validated',
      type: 'did'
    });

    const didObjects = response.result.account_objects as unknown as DIDObject[];

    // An account can only have one DID object
    return didObjects.length > 0 ? didObjects[0] : null;
  } catch (error) {
    console.error('Error fetching DID:', error);
    return null;
  }
};

/**
 * Get DID display data with decoded fields
 */
export const getDIDDisplayData = (did: DIDObject): DIDDisplayData => {
  return {
    ...did,
    decodedDIDDocument: did.DIDDocument ? hexToString(did.DIDDocument) : undefined,
    decodedData: did.Data ? hexToString(did.Data) : undefined,
    decodedURI: did.URI ? hexToString(did.URI) : undefined
  };
};

/**
 * Fetch DID with display data for an account
 */
export const fetchDIDDisplayData = async (
  client: Client,
  address: string
): Promise<DIDDisplayData | null> => {
  const did = await fetchDID(client, address);

  if (!did) {
    return null;
  }

  return getDIDDisplayData(did);
};

/**
 * Truncate string for display
 */
export const truncateString = (str: string, maxLength = 50): string => {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength)}...`;
};
