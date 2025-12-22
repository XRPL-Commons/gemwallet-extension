export interface PasskeyCredential {
  credentialId: string; // base64 encoded
  publicKey: string; // base64 encoded COSE public key
  userHandle: string; // base64 encoded user ID
  encryptedPassword: string; // AES encrypted password
  createdAt: number; // timestamp
}
