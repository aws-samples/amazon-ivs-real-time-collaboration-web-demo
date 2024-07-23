#!/usr/bin/env node
import 'source-map-support/register';

import { SSMParameterReader } from '@Lib/constructs';
import { BackendStack, CertificateStack, WebsiteStack } from '@Lib/stacks';
import { Config, DeployConfig } from '@Lib/types';
import { deepMerge } from '@Lib/utils';
import {
  BACKEND_STACK_PREFIX,
  WEBSITE_STACK_PREFIX
} from '@Shared/config.json';
import { AppEnv, StackType } from '@Shared/types';
import { App, Environment } from 'aws-cdk-lib';

const app = new App();
const appEnv = (process.env.APP_ENV || AppEnv.DEV) as AppEnv;
const isBootstrap = JSON.parse(process.env.BOOTSTRAP || 'false');

// Environment
const account = process.env.AWS_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION;
const env: Environment = { account, region };

// Runtime context values
const stackType: StackType = app.node.tryGetContext('stackType');
const globalConfig: Partial<Config> = app.node.tryGetContext('global');
const appEnvConfig: Partial<Config> = app.node.tryGetContext(appEnv);
const config: Config = deepMerge(globalConfig, appEnvConfig);

if (stackType === StackType.BACKEND || isBootstrap) {
  const stackName = `${BACKEND_STACK_PREFIX}-${appEnv}`;
  new BackendStack(app, stackName, { env, appEnv, config });
}

if (stackType === StackType.WEBSITE || isBootstrap) {
  const { domain, subdomain, sslCertificateARN } = config;
  let deployConfig: DeployConfig | undefined;
  let certArn = sslCertificateARN;

  const stackName = `${WEBSITE_STACK_PREFIX}-${appEnv}`;
  const siteStack = new WebsiteStack(app, stackName, { env, appEnv, config });

  if (appEnv !== AppEnv.DEV) {
    if (!domain) {
      throw new Error(
        'A domain must be provided when deploying to a non-dev environment.'
      );
    }

    const siteDomain = subdomain ? `${subdomain}.${domain}` : domain;
    const hostedZone = siteStack.lookupHostedZone(domain);

    if (!certArn) {
      // Create a cross-region DNS-validated ACM Certificate
      const certStackName = `${WEBSITE_STACK_PREFIX}-certificate`;
      const certStack = new CertificateStack(app, certStackName, {
        siteDomain,
        hostedZone,
        terminationProtection: true,
        config: { ...config, domain },
        env: { ...env, region: 'us-east-1' } // Certificate must reside in the "us-east-1" region
      });
      siteStack.addDependency(certStack);

      ({ parameterValue: certArn } = new SSMParameterReader(
        siteStack,
        'CertificateArnReader',
        certStack.certificateArnParam
      ));
    }

    const certificate = siteStack.importCertificate('Certificate', certArn);
    deployConfig = { certificate, siteDomain, hostedZone };
  }

  siteStack.deploy(deployConfig);
}
