import { STORAGE_PASSKEY_CREDENTIAL } from '../constants';
import { PasskeyCredential } from '../types';
import { encrypt, decrypt } from './crypto';
import {
  saveInChromeLocalStorage,
  loadFromChromeLocalStorage,
  deleteFromChromeLocalStorage
} from './storageChromeLocal';

// Storage helpers that work in both dev and production
const savePasskeyCredential = async (credential: PasskeyCredential): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    await saveInChromeLocalStorage(STORAGE_PASSKEY_CREDENTIAL, credential);
  } else {
    // In development, use localStorage as fallback
    localStorage.setItem(STORAGE_PASSKEY_CREDENTIAL, JSON.stringify(credential));
  }
};

const loadPasskeyCredential = async (): Promise<PasskeyCredential | null> => {
  if (process.env.NODE_ENV === 'production') {
    const credential = await loadFromChromeLocalStorage(STORAGE_PASSKEY_CREDENTIAL);
    if (credential && typeof credential === 'object') {
      return credential as PasskeyCredential;
    }
    return null;
  } else {
    // In development, use localStorage as fallback
    const stored = localStorage.getItem(STORAGE_PASSKEY_CREDENTIAL);
    if (stored) {
      try {
        return JSON.parse(stored) as PasskeyCredential;
      } catch {
        return null;
      }
    }
    return null;
  }
};

const deletePasskeyCredential = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    deleteFromChromeLocalStorage(STORAGE_PASSKEY_CREDENTIAL);
  } else {
    // In development, use localStorage as fallback
    localStorage.removeItem(STORAGE_PASSKEY_CREDENTIAL);
  }
};

// Helper to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Check if WebAuthn is supported in the browser
export const isPasskeySupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
};

// Check if platform authenticator (Touch ID, Windows Hello, etc.) is available
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isPasskeySupported()) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// Check if passkey is already set up
export const isPasskeyEnabled = async (): Promise<boolean> => {
  try {
    const credential = await loadPasskeyCredential();
    return credential !== null;
  } catch {
    return false;
  }
};

// Get stored passkey credential
export const getStoredPasskeyCredential = async (): Promise<PasskeyCredential | null> => {
  try {
    return await loadPasskeyCredential();
  } catch {
    return null;
  }
};

// Register a new passkey
export const registerPasskey = async (password: string): Promise<boolean> => {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
  if (!isPlatformAvailable) {
    throw new Error('Platform authenticator (Touch ID, Windows Hello) is not available');
  }

  try {
    // Generate a random challenge
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // Generate a random user ID
    const userId = crypto.getRandomValues(new Uint8Array(16));

    // Create credential options
    const options: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'GemWallet'
        // Note: In extension context, we omit rp.id to use the extension origin
      },
      user: {
        id: userId,
        name: 'gemwallet-user',
        displayName: 'GemWallet User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256 (ECDSA with P-256)
        { alg: -257, type: 'public-key' } // RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
        requireResidentKey: true
      },
      timeout: 60000,
      attestation: 'none' // We don't need attestation for this use case
    };

    // Create the credential
    const credential = (await navigator.credentials.create({
      publicKey: options
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Failed to create passkey credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Extract the public key from the attestation
    const publicKeyBytes = response.getPublicKey();
    if (!publicKeyBytes) {
      throw new Error('Failed to extract public key from credential');
    }

    // Encrypt the password using the credential ID as part of the encryption key
    const encryptionKey = arrayBufferToBase64(credential.rawId);
    const encryptedPassword = encrypt(password, encryptionKey);

    // Store the credential data
    const passkeyCredential: PasskeyCredential = {
      credentialId: arrayBufferToBase64(credential.rawId),
      // @ts-ignore - Uint8Array buffer property compatibility
      publicKey: arrayBufferToBase64(publicKeyBytes.buffer),
      // @ts-ignore - Uint8Array to ArrayBuffer conversion
      userHandle: arrayBufferToBase64(userId),
      encryptedPassword,
      createdAt: Date.now()
    };

    await savePasskeyCredential(passkeyCredential);

    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with more context if it's a known error
      if (error.name === 'NotAllowedError') {
        throw new Error('Passkey registration was cancelled or not allowed');
      }
      if (error.name === 'InvalidStateError') {
        throw new Error('A passkey already exists for this account');
      }
      throw error;
    }
    throw new Error('Failed to register passkey');
  }
};

// Authenticate with passkey and return the decrypted password
export const authenticateWithPasskey = async (): Promise<string | null> => {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const storedCredential = await getStoredPasskeyCredential();
  if (!storedCredential) {
    throw new Error('No passkey is registered');
  }

  try {
    // Generate a random challenge
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // Create authentication options
    const options: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: base64ToArrayBuffer(storedCredential.credentialId),
          type: 'public-key',
          transports: ['internal'] // Platform authenticator
        }
      ],
      userVerification: 'required',
      timeout: 60000
    };

    // Request authentication
    const assertion = (await navigator.credentials.get({
      publicKey: options
    })) as PublicKeyCredential | null;

    if (!assertion) {
      throw new Error('Authentication failed');
    }

    // Verify the credential ID matches
    const assertionCredentialId = arrayBufferToBase64(assertion.rawId);
    if (assertionCredentialId !== storedCredential.credentialId) {
      throw new Error('Credential ID mismatch');
    }

    // The user has been verified by the authenticator (biometric check passed)
    // Now decrypt and return the password
    const decryptedPassword = decrypt(
      storedCredential.encryptedPassword,
      storedCredential.credentialId
    );

    if (!decryptedPassword) {
      throw new Error('Failed to decrypt password');
    }

    return decryptedPassword;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Passkey authentication was cancelled or not allowed');
      }
      throw error;
    }
    throw new Error('Failed to authenticate with passkey');
  }
};

// Remove the stored passkey
export const removePasskey = async (): Promise<void> => {
  await deletePasskeyCredential();
};
