import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import credsProviders from '@aws-sdk/credential-providers';
import util from 'util';

import config from '../shared/config.json';

const { values: args } = util.parseArgs({
  options: {
    appEnv: { type: 'string' }
  },
  strict: true
});

if (!args.appEnv) {
  throw new Error('App environment not provided.');
}

const { appEnv } = args;
const awsProfile = process.env.AWS_PROFILE;
const credentials = credsProviders.fromIni({ profile: awsProfile });
const cloudFormationClient = new CloudFormationClient({ credentials });
const lambdaClient = new LambdaClient({ credentials });

async function rotateKeyPair() {
  const stackName = `${config.BACKEND_STACK_PREFIX}-${appEnv}`;
  const dsCommand = new DescribeStacksCommand({ StackName: stackName });
  const dsResponse = await cloudFormationClient.send(dsCommand);
  const stackOutputs = dsResponse.Stacks?.[0]?.Outputs ?? [];

  const { OutputValue: rotateKeyPairFunc } = stackOutputs.find((output) => {
    const [exportKey] = output.ExportName.split('::').slice(-1);

    return exportKey === 'rotateKeyPairFunctionName';
  });

  const invokeCommand = new InvokeCommand({ FunctionName: rotateKeyPairFunc });
  const invokeResponse = await lambdaClient.send(invokeCommand);
  const responseJson = invokeResponse.Payload.transformToString();
  const responseData = JSON.parse(responseJson);

  if (responseData.errorType) {
    console.info(`\n❌ Failed to rotate ${appEnv} key-pair!\n`);
    console.info(JSON.stringify(responseData, null, 2));
  } else {
    console.info(`\n✅ Successfully rotated ${appEnv} key-pair!\n`);
    console.info(`🔑 Public Key ARN: ${responseData.body}\n`);
  }
}

rotateKeyPair();
