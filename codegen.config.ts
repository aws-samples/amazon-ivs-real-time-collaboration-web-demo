import { CodegenConfig } from '@graphql-codegen/cli';

const codegenConfig: CodegenConfig = {
  overwrite: true,
  schema: [
    'infra/lib/stacks/BackendStack/graphql/schemas/messages.graphql',
    'infra/lib/stacks/BackendStack/graphql/schemas/aws.graphql'
  ],
  config: {
    scalars: {
      AWSJSON: 'string',
      AWSDate: 'string',
      AWSTime: 'string',
      AWSDateTime: 'string',
      AWSTimestamp: 'number',
      AWSEmail: 'string',
      AWSURL: 'string',
      AWSPhone: 'string',
      AWSIPAddress: 'string',
      BigInt: 'number',
      Double: 'number'
    }
  },
  hooks: { afterAllFileWrite: 'prettier --write' },
  generates: {
    'shared/codegen.types.ts': {
      plugins: ['typescript']
    }
  }
};

export default codegenConfig;
