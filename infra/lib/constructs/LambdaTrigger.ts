import {
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  custom_resources as cr
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

class LambdaTrigger extends cr.AwsCustomResource {
  constructor(scope: Construct, id: string, lambdaFunction: lambda.Function) {
    const lambdaAwsSdkCall: cr.AwsSdkCall = {
      service: 'lambda',
      action: 'Invoke',
      parameters: { FunctionName: lambdaFunction.functionName },
      physicalResourceId: cr.PhysicalResourceId.of(
        `${id}AwsSdkCall:${lambdaFunction.currentVersion.version}`
      )
    };

    const lambdaCrPolicy = cr.AwsCustomResourcePolicy.fromStatements([
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [lambdaFunction.functionArn]
      })
    ]);

    super(scope, id, {
      onUpdate: lambdaAwsSdkCall,
      policy: lambdaCrPolicy,
      installLatestAwsSdk: false,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    this.node.addDependency(lambdaFunction);
  }
}

export default LambdaTrigger;
