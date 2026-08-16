import {
  apiFetch,
  getAuthToken,
  getSavedUser,
} from "@/lib/api";

const privateKeyStorage =
  "nerdding.messaging.private-key.v1";

const publicKeyStorage =
  "nerdding.messaging.public-key.v1";

const keyAlgorithm = {
  name: "RSA-OAEP",
  hash: "SHA-256",
} as const;

type Jwk = JsonWebKey;

function encode(bytes: ArrayBuffer) {
  return btoa(
    String.fromCharCode(
      ...new Uint8Array(bytes),
    ),
  );
}

function decode(value: string): ArrayBuffer {
  const bytes = Uint8Array.from(
    atob(value),
    (character) =>
      character.charCodeAt(0),
  );

  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function getOrCreateKeys() {
  if (!getAuthToken()) {
    throw new Error(
      "Sign in to use encrypted messaging.",
    );
  }

  const savedPrivate =
    window.localStorage.getItem(
      privateKeyStorage,
    );

  const savedPublic =
    window.localStorage.getItem(
      publicKeyStorage,
    );

  if (savedPrivate && savedPublic) {
    const privateJwk =
      JSON.parse(savedPrivate) as Jwk;

    const publicJwk =
      JSON.parse(savedPublic) as Jwk;

    const privateKey =
      await crypto.subtle.importKey(
        "jwk",
        privateJwk,
        keyAlgorithm,
        false,
        ["decrypt"],
      );

    return {
      privateKey,
      publicJwk,
    };
  }

  const pair =
    await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([
          1,
          0,
          1,
        ]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

  const privateJwk =
    await crypto.subtle.exportKey(
      "jwk",
      pair.privateKey,
    );

  const publicJwk =
    await crypto.subtle.exportKey(
      "jwk",
      pair.publicKey,
    );

  window.localStorage.setItem(
    privateKeyStorage,
    JSON.stringify(privateJwk),
  );

  window.localStorage.setItem(
    publicKeyStorage,
    JSON.stringify(publicJwk),
  );

  return {
    privateKey: pair.privateKey,
    publicJwk,
  };
}

let identityPromise:
  | Promise<
      Awaited<
        ReturnType<
          typeof getOrCreateKeys
        >
      >
    >
  | null = null;

export async function ensureMessagingIdentity() {
  if (!identityPromise) {
    identityPromise =
      getOrCreateKeys().then(
        async (keys) => {
          const alreadyRegistered =
            window.localStorage.getItem(
              "nerdding.messaging.registered.v1",
            );

          if (!alreadyRegistered) {
            await apiFetch(
              "/messages/keys",
              {
                method: "POST",
                body: JSON.stringify({
                  publicKey:
                    JSON.stringify(
                      keys.publicJwk,
                    ),
                  version: 1,
                }),
              },
            );

            window.localStorage.setItem(
              "nerdding.messaging.registered.v1",
              "true",
            );
          }

          return keys;
        },
      );
  }

  return identityPromise;
}

async function importPublicKey(
  value: string,
) {
  return crypto.subtle.importKey(
    "jwk",
    JSON.parse(value) as Jwk,
    keyAlgorithm,
    false,
    ["encrypt"],
  );
}

export async function encryptMessage(
  body: string,
  recipientPublicKey: string,
) {
  const keys =
    await ensureMessagingIdentity();

  const recipient =
    await importPublicKey(
      recipientPublicKey,
    );

  const senderPublic =
    await importPublicKey(
      JSON.stringify(keys.publicJwk),
    );

  const messageKey =
    await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    );

  const iv =
    crypto.getRandomValues(
      new Uint8Array(12),
    );

  const ciphertext =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      messageKey,
      new TextEncoder().encode(body),
    );

  const rawKey =
    await crypto.subtle.exportKey(
      "raw",
      messageKey,
    );

  const [
    senderKey,
    recipientKey,
  ] = await Promise.all([
    crypto.subtle.encrypt(
      keyAlgorithm,
      senderPublic,
      rawKey,
    ),
    crypto.subtle.encrypt(
      keyAlgorithm,
      recipient,
      rawKey,
    ),
  ]);

  return {
    ciphertext: encode(ciphertext),
    iv: encode(
      iv.buffer as ArrayBuffer,
    ),
    senderKey: encode(senderKey),
    recipientKey: encode(recipientKey),
    encryptionVersion: 1,
  };
}

export async function decryptMessage(
  message: {
    senderId: string;
    ciphertext?: string | null;
    iv?: string | null;
    senderKey?: string | null;
    recipientKey?: string | null;
  },
) {
  if (
    !message.ciphertext ||
    !message.iv
  ) {
    return "Encrypted message unavailable";
  }

  const keys =
    await getOrCreateKeys();

  const wrapped =
    message.senderId ===
    getSavedUser()?.id
      ? message.senderKey
      : message.recipientKey;

  if (!wrapped) {
    return "Encrypted message unavailable";
  }

  try {
    const rawKey =
      await crypto.subtle.decrypt(
        keyAlgorithm,
        keys.privateKey,
        decode(wrapped),
      );

    const messageKey =
      await crypto.subtle.importKey(
        "raw",
        rawKey,
        {
          name: "AES-GCM",
        },
        false,
        ["decrypt"],
      );

    const clear =
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: decode(message.iv),
        },
        messageKey,
        decode(message.ciphertext),
      );

    return new TextDecoder().decode(
      clear,
    );
  } catch {
    return "Unable to decrypt this message on this device";
  }
}
