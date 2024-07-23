import {
  aws_certificatemanager as acm,
  aws_route53 as route53
} from 'aws-cdk-lib';

interface Config {
  readonly domain?: string;
  readonly subdomain?: string;
  readonly certificateAlternativeDomains?: string[] | null;
  readonly sslCertificateARN?: string | null;
  readonly allowedSignUpDomains?: string[] | null;
}

interface DeployConfig {
  siteDomain: string;
  hostedZone: route53.IHostedZone;
  certificate: acm.ICertificate;
}

export type { Config, DeployConfig };
