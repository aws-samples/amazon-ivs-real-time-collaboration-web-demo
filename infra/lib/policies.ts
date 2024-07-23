import { aws_iam as iam } from 'aws-cdk-lib';

const ivsGetResourcesPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['ivs:GetParticipant', 'ivs:ListParticipants', 'ivs:ListStages'],
  resources: ['*']
});

const ivsCreateResourcesPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['ivs:CreateStage', 'ivschat:CreateRoom'],
  resources: ['*']
});

const ivsDeleteResourcesPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['ivs:DeleteStage', 'ivschat:DeleteRoom'],
  resources: ['*']
});

const ivsChatCreateTokensPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['ivschat:CreateChatToken'],
  resources: ['*']
});

const ivsPublicKeyPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['ivs:ImportPublicKey', 'ivs:GetPublicKey', 'ivs:DeletePublicKey'],
  resources: ['*']
});

const ivsTagResourcesPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['ivs:TagResource', 'ivschat:TagResource'],
  resources: ['*']
});

const kmsGenerateDataKeyPairPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['kms:GenerateDataKeyPair'],
  resources: ['*']
});

export {
  ivsChatCreateTokensPolicy,
  ivsCreateResourcesPolicy,
  ivsDeleteResourcesPolicy,
  ivsGetResourcesPolicy,
  ivsPublicKeyPolicy,
  ivsTagResourcesPolicy,
  kmsGenerateDataKeyPairPolicy
};
