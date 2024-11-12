import { kmsSdk, realTimeSdk, secretsManagerSdk, ssmSdk } from '@Lambda/sdk';
import { createErrorResponse, createSuccessResponse } from '@Lambda/utils';

const {
  SYMMETRIC_KEY_ARN,
  PUBLIC_KEY_PREFIX,
  PRIVATE_KEY_SECRET_ARN,
  PUBLIC_KEY_ARN_PARAM_NAME
} = process.env as Record<string, string>;

async function rotateKeyPair() {
  const { privateKeyPem, publicKeyPem } =
    await kmsSdk.generateECDSAKeyPair(SYMMETRIC_KEY_ARN);

  console.info('Generated a PEM-formatted ECDSA key-pair.');

  const [newPublicKeyArn, privateKeySecret] = await Promise.all([
    // Import a new PublicKey from the generated PEM-formatted Public Key
    realTimeSdk.importPublicKey(PUBLIC_KEY_PREFIX, publicKeyPem),
    // Store the generated PEM-formatted Private Key in Secrets Manager
    secretsManagerSdk.putSecretValue(PRIVATE_KEY_SECRET_ARN, privateKeyPem)
  ]);

  console.info(
    `Imported a new Public Key "${newPublicKeyArn}".`,
    `Stored a new Private Key in Secrets Manager "${privateKeySecret.name}" with version ID ${privateKeySecret.versionId}.`
  );

  await ssmSdk.putParameter(
    PUBLIC_KEY_ARN_PARAM_NAME,
    JSON.stringify({ arn: newPublicKeyArn }),
    'Stores the ARN of the imported Public Key used to verify stage participant tokens.'
  );

  console.info(
    `SSM parameter "${PUBLIC_KEY_ARN_PARAM_NAME}" updated with new value "${newPublicKeyArn}".`
  );

  return newPublicKeyArn;
}

async function handler() {
  let oldPublicKeyArn: string | undefined;
  let newPublicKeyArn: string;

  try {
    oldPublicKeyArn = await realTimeSdk.getPublicKeyArn();
    newPublicKeyArn = await rotateKeyPair();

    console.info(`Created Public Key "${newPublicKeyArn}".`);
  } catch (error) {
    return createErrorResponse({
      error: new Error('Failed to rotate key-pair', { cause: error })
    });
  }

  if (oldPublicKeyArn) {
    try {
      await realTimeSdk.deletePublicKey(oldPublicKeyArn);

      console.info(`Deleted Public Key "${oldPublicKeyArn}".`);
    } catch (error) {
      return createErrorResponse({
        error: new Error(
          `Failed to delete old Public Key "${oldPublicKeyArn}".`,
          { cause: error }
        )
      });
    }
  }

  return createSuccessResponse({ body: newPublicKeyArn });
}

export { handler };
