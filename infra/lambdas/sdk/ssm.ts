import {
  GetParameterCommand,
  Parameter,
  ParameterTier,
  ParameterType,
  PutParameterCommand,
  SSMClient
} from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();

async function getParameter(name: string) {
  const { Parameter: parameter } = await ssmClient.send(
    new GetParameterCommand({ Name: name })
  );

  return (parameter as Parameter).Value as string;
}

async function putParameter(name: string, value: string, description?: string) {
  const { Version: versionId } = await ssmClient.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Description: description,
      DataType: 'text',
      Overwrite: true,
      Type: ParameterType.STRING,
      Tier: ParameterTier.STANDARD
    })
  );

  return { versionId };
}

export { getParameter, putParameter };
