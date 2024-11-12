import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
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
const lambdaClient = new LambdaClient();
const cloudFormationClient = new CloudFormationClient();

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
  const response = JSON.parse(responseJson);

  if (response.statusCode >= 200 && response.statusCode < 300) {
    console.info(`\n✅ Successfully rotated ${appEnv} key-pair!\n`);
    console.info(`🔑 Public Key ARN: ${response.body}\n`);
  } else {
    console.info(`\n❌ Failed to rotate ${appEnv} key-pair!\n`);
    console.info({
      statusCode: response.statusCode,
      ...JSON.parse(response.body)
    });
  }
}

rotateKeyPair();
