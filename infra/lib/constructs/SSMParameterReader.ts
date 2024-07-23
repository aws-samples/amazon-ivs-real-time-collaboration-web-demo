import {
  Arn,
  ArnFormat,
  aws_ssm as ssm,
  custom_resources as cr,
  Stack
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

class SSMParameterReader extends cr.AwsCustomResource {
  constructor(scope: Construct, id: string, parameter: ssm.StringParameter) {
    const { parameterName, stack: parameterStack } = parameter;

    const ssmAwsSdkCall: cr.AwsSdkCall = {
      service: 'ssm',
      action: 'GetParameter',
      region: parameterStack.region,
      parameters: { Name: parameterName },
      physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString())
    };

    const ssmCrPolicy = cr.AwsCustomResourcePolicy.fromSdkCalls({
      resources: [
        Arn.format(
          {
            service: 'ssm',
            resource: 'parameter',
            region: parameterStack.region,
            arnFormat: ArnFormat.NO_RESOURCE_NAME
          },
          Stack.of(scope)
        ).concat(parameterName)
      ]
    });

    super(scope, id, { onUpdate: ssmAwsSdkCall, policy: ssmCrPolicy });
  }

  get parameterValue() {
    return this.getResponseField('Parameter.Value').toString();
  }
}

export default SSMParameterReader;
