import {
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejsLambda,
  aws_logs as logs,
  Duration
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

class EnhancedLambdaFunction extends nodejsLambda.NodejsFunction {
  constructor(
    scope: Construct,
    id: string,
    props: nodejsLambda.NodejsFunctionProps
  ) {
    const { bundling, ...restProps } = props;

    super(scope, id, {
      timeout: Duration.seconds(6),
      tracing: lambda.Tracing.ACTIVE,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [],
        ...bundling
      },
      ...restProps
    });

    Object.entries(this.baseEnv).forEach((envVar) => {
      this.addEnvironment(...envVar);
    });
  }

  private get baseEnv(): Record<string, string> {
    return {
      AWS_MAX_ATTEMPTS: '6',
      STACK: this.stack.stackName
    };
  }

  configureProvisionedConcurrency(opts?: Partial<lambda.AutoScalingOptions>) {
    const alias = this.addAlias('PCASAlias', {
      provisionedConcurrentExecutions: 1,
      maxEventAge: Duration.minutes(1)
    });

    alias
      .addAutoScaling({ maxCapacity: 100, ...opts })
      .scaleOnUtilization({ utilizationTarget: 0.5 });

    return alias;
  }
}

export default EnhancedLambdaFunction;
