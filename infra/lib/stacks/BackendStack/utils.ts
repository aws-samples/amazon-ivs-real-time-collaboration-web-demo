import {
  aws_appsync as appsync,
  aws_lambda as lambda,
  Duration
} from 'aws-cdk-lib';
import path from 'path';

type TypeName = 'Query' | 'Mutation' | 'Subscription';

function getAppSyncUnitResolverPath(typeName: string, fieldName: string) {
  return path.join(
    import.meta.dirname,
    '../../../dist/appsync/resolvers',
    `${typeName}.${fieldName}.js`
  );
}

function createAppSyncUnitResolver({
  typeName,
  fieldName,
  dataSource
}: {
  typeName: TypeName;
  fieldName: string;
  dataSource: appsync.BaseDataSource;
}) {
  const resolverPath = getAppSyncUnitResolverPath(typeName, fieldName);
  const resolverCode = appsync.Code.fromAsset(resolverPath);

  return dataSource.createResolver(`${typeName}.${fieldName}`, {
    typeName,
    fieldName,
    code: resolverCode,
    runtime: appsync.FunctionRuntime.JS_1_0_0
  });
}

// https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#events-sqs-queueconfig
function calcVisibilityTimeout(lambdaFn: lambda.Function) {
  const lambdaTimeoutSeconds = lambdaFn.timeout?.toSeconds() || 3;

  return Duration.seconds(6 * lambdaTimeoutSeconds);
}

export { calcVisibilityTimeout, createAppSyncUnitResolver };
