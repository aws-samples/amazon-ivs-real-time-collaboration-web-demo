import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';

const secretsManagerClient = new SecretsManagerClient();

async function getSecretValue(secretId: string) {
  const { SecretString: secretValue } = await secretsManagerClient.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  return secretValue as string;
}

async function putSecretValue(secretId: string, secretValue: string) {
  const { Name: name, VersionId: versionId } = await secretsManagerClient.send(
    new PutSecretValueCommand({
      SecretId: secretId,
      SecretString: secretValue
    })
  );

  return { name, versionId };
}

export { getSecretValue, putSecretValue };
