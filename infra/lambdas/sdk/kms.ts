import {
  DataKeyPairSpec,
  GenerateDataKeyPairCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import crypto from 'crypto';

const kmsClient = new KMSClient();

// The KMS public key is a DER-encoded X.509 SubjectPublicKeyInfo (SPKI), as specified in RFC 5280
function convertKmsPublicKeyToPEM(encodedKey: Uint8Array) {
  const key = Buffer.from(encodedKey);
  const type: crypto.PublicKeyInput['type'] = 'spki';

  return crypto
    .createPublicKey({ key, type, format: 'der' })
    .export({ type, format: 'pem' })
    .toString();
}

// The KMS private key is a DER-encoded PKCS8 PrivateKeyInfo, as specified in RFC 5958
function convertKmsPrivateKeyToPEM(encodedKey: Uint8Array) {
  const key = Buffer.from(encodedKey);
  const type: crypto.PrivateKeyInput['type'] = 'pkcs8';

  return crypto
    .createPrivateKey({ key, type, format: 'der' })
    .export({ type, format: 'pem' })
    .toString();
}

async function generateECDSAKeyPair(symmetricKeyId: string) {
  const { PublicKey: publicKey, PrivateKeyPlaintext: privateKey } =
    await kmsClient.send(
      new GenerateDataKeyPairCommand({
        KeyId: symmetricKeyId,
        KeyPairSpec: DataKeyPairSpec.ECC_NIST_P384 // secp384r1
      })
    );

  return {
    publicKeyPem: convertKmsPublicKeyToPEM(publicKey as Uint8Array),
    privateKeyPem: convertKmsPrivateKeyToPEM(privateKey as Uint8Array)
  };
}

export { generateECDSAKeyPair };
