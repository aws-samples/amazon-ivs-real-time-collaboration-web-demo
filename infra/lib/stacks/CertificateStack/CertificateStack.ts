import { Config } from '@Lib/types';
import { WithRequired } from '@Shared/types';
import {
  aws_certificatemanager as acm,
  aws_route53 as route53,
  aws_ssm as ssm,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface CertificateStackProps extends StackProps {
  readonly config: WithRequired<Config, 'domain'>;
  readonly hostedZone: route53.IHostedZone;
  readonly siteDomain: string;
}

class CertificateStack extends Stack {
  readonly certificateArnParam: ssm.StringParameter;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);
    const { config, siteDomain, hostedZone } = props;
    const { domain, certificateAlternativeDomains } = config;

    const certificate = new acm.Certificate(this, 'DnsValidatedCertificate', {
      domainName: domain,
      validation: acm.CertificateValidation.fromDns(hostedZone),
      subjectAlternativeNames: certificateAlternativeDomains || [siteDomain]
    });
    certificate.applyRemovalPolicy(RemovalPolicy.RETAIN);

    this.certificateArnParam = new ssm.StringParameter(this, 'CertificateArn', {
      tier: ssm.ParameterTier.STANDARD,
      dataType: ssm.ParameterDataType.TEXT,
      stringValue: certificate.certificateArn,
      parameterName: `/cdk/exports/${this.stackName}/${domain}`,
      description: `Certificate ARN used for website deployments under the domain "${domain}"`
    });

    new CfnOutput(this, 'certificateArn', {
      value: certificate.certificateArn
    });
  }
}

export default CertificateStack;
