/**
 * End-to-End Encryption (E2EE) Utility for Pulse-X Messenger
 * Utilizes native Web Crypto API (window.crypto.subtle) with ECDH P-256 & AES-256-GCM.
 */

const E2EE_PREFIX = 'E2EE_V1::';

// Convert ArrayBuffer to Base64 String
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 String to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * 1. Generate an ECDH Key Pair (P-256 curve)
 */
export const generateECDHKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );
};

/**
 * 2. Export Public Key to JWK JSON String
 */
export const exportPublicKey = async (publicKey) => {
  const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(jwk);
};

/**
 * 3. Import Friend's Public Key from JWK JSON String
 */
export const importPublicKey = async (jwkString) => {
  try {
    const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      []
    );
  } catch (err) {
    console.error('Failed to import public key:', err);
    return null;
  }
};

/**
 * 4. Export Private Key to JWK JSON String (for local storage)
 */
export const exportPrivateKey = async (privateKey) => {
  const jwk = await window.crypto.subtle.exportKey('jwk', privateKey);
  return JSON.stringify(jwk);
};

/**
 * 5. Import Private Key from JWK JSON String
 */
export const importPrivateKey = async (jwkString) => {
  try {
    const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  } catch (err) {
    console.error('Failed to import private key:', err);
    return null;
  }
};

/**
 * 6. Derive Shared Symmetric Key (AES-GCM 256) using ECDH Diffie-Hellman
 */
export const deriveSharedKey = async (myPrivateKey, friendPublicKey) => {
  try {
    return await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: friendPublicKey
      },
      myPrivateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.error('Failed to derive shared key:', err);
    return null;
  }
};

/**
 * 7. Encrypt Plaintext Message with Shared AES-GCM Key
 */
export const encryptMessage = async (text, aesKey) => {
  if (!text || !aesKey) return text;

  try {
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      aesKey,
      encodedText
    );

    const ivBase64 = bufferToBase64(iv);
    const ciphertextBase64 = bufferToBase64(encryptedBuffer);

    return `${E2EE_PREFIX}${ivBase64}::${ciphertextBase64}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text;
  }
};

/**
 * 8. Decrypt Ciphertext Message with Shared AES-GCM Key
 */
export const decryptMessage = async (encryptedString, aesKey) => {
  if (!encryptedString || typeof encryptedString !== 'string') return encryptedString;
  if (!encryptedString.startsWith(E2EE_PREFIX) || !aesKey) return encryptedString;

  try {
    const payload = encryptedString.replace(E2EE_PREFIX, '');
    const [ivBase64, ciphertextBase64] = payload.split('::');

    if (!ivBase64 || !ciphertextBase64) return encryptedString;

    const iv = base64ToBuffer(ivBase64);
    const ciphertext = base64ToBuffer(ciphertextBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      aesKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    // If decryption fails (e.g. key mismatch or legacy unencrypted text)
    return encryptedString;
  }
};

/**
 * 9. Key Manager Helper for User's Local Keys
 */
export const getOrGenerateUserKeys = async (userId) => {
  if (!userId) return null;

  const storageKeyPub = `pulse_pub_key_${userId}`;
  const storageKeyPriv = `pulse_priv_key_${userId}`;

  let pubJwk = localStorage.getItem(storageKeyPub);
  let privJwk = localStorage.getItem(storageKeyPriv);

  if (pubJwk && privJwk) {
    const publicKey = await importPublicKey(pubJwk);
    const privateKey = await importPrivateKey(privJwk);
    if (publicKey && privateKey) {
      return { publicKey, privateKey, pubJwk, privJwk };
    }
  }

  // Generate new Key Pair
  const keyPair = await generateECDHKeyPair();
  const newPubJwk = await exportPublicKey(keyPair.publicKey);
  const newPrivJwk = await exportPrivateKey(keyPair.privateKey);

  localStorage.setItem(storageKeyPub, newPubJwk);
  localStorage.setItem(storageKeyPriv, newPrivJwk);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    pubJwk: newPubJwk,
    privJwk: newPrivJwk
  };
};

/**
 * 10. Fallback Peer Public Key Generator for users who haven't uploaded keys yet
 */
export const getFallbackPeerPublicKey = async (peerId) => {
  if (!peerId) return null;
  const storageKey = `pulse_peer_pub_${peerId}`;

  try {
    const savedJwk = localStorage.getItem(storageKey);
    if (savedJwk) {
      const key = await importPublicKey(savedJwk);
      if (key) return key;
    }

    const keyPair = await generateECDHKeyPair();
    const jwk = await exportPublicKey(keyPair.publicKey);
    localStorage.setItem(storageKey, jwk);
    return keyPair.publicKey;
  } catch (err) {
    return null;
  }
};
