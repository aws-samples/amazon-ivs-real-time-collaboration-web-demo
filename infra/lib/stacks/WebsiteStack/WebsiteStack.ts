import { EnhancedS3Bucket } from '@Lib/constructs';
import { Config, DeployConfig } from '@Lib/types';
import { createResourceName } from '@Lib/utils';
import { AppEnv } from '@Shared/types';
import {
  aws_certificatemanager as acm,
  aws_cloudfront as cf,
  aws_cloudfront_origins as origins,
  aws_route53 as route53,
  aws_route53_targets as targets,
  aws_s3_deployment as s3d,
  CfnOutput,
  Duration,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fs from 'fs';
import path from 'path';

import { createErrorResponse } from './utils';

interface WebsiteStackProps extends StackProps {
  readonly appEnv: AppEnv;
  readonly config: Config;
}

const BUILD_PATH = path.resolve(import.meta.dirname, '../../../../build');
const BUILD_VERSION_PATH = path.resolve(
  import.meta.dirname,
  '../../../../buildVersion.txt'
);

class WebsiteStack extends Stack {
  readonly appEnv: AppEnv;

  readonly config: Config;

  readonly originPath: string;

  readonly buildVersion?: string;

  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);
    this.appEnv = props.appEnv;
    this.config = props.config;

    if (fs.existsSync(BUILD_VERSION_PATH)) {
      this.buildVersion = fs.readFileSync(BUILD_VERSION_PATH, {
        encoding: 'utf8'
      });
    }

    this.originPath = this.buildVersion || Date.now().toString();
  }

  deploy(deployConfig?: DeployConfig) {
    const serverAccessLogsBucket = new EnhancedS3Bucket(this, 'LogsBucket', {
      bucketName: deployConfig && `${deployConfig.siteDomain}-logs`,
      intelligentTieringConfigurations: [
        {
          name: 'archive',
          archiveAccessTierTime: Duration.days(90),
          deepArchiveAccessTierTime: Duration.days(180)
        }
      ]
    });

    const websiteBucket = new EnhancedS3Bucket(this, 'WebsiteBucket', {
      bucketName: deployConfig && `${deployConfig.siteDomain}-website`,
      serverAccessLogsBucket
    });

    const oai = new cf.OriginAccessIdentity(this, 'OAI');
    websiteBucket.grantRead(oai);

    const s3Origin = new origins.S3Origin(websiteBucket, {
      originPath: `/${this.originPath}`,
      originAccessIdentity: oai
    });

    const cacheControlResponseHeadersPolicy = new cf.ResponseHeadersPolicy(
      this,
      'CacheControlHeaders',
      {
        responseHeadersPolicyName:
          deployConfig &&
          createResourceName(
            this,
            `CacheControlHeaders-${deployConfig.siteDomain.replaceAll('.', '_')}`
          ),
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
              override: true
            },
            { header: 'Pragma', value: 'no-cache', override: true },
            { header: 'Expires', value: '-1', override: true }
          ]
        }
      }
    );

    const distribution = new cf.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: s3Origin,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cf.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cf.OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cacheControlResponseHeadersPolicy
      },
      enableIpv6: true,
      defaultRootObject: 'index.html',
      httpVersion: cf.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      domainNames: deployConfig && [deployConfig.siteDomain],
      certificate: deployConfig?.certificate,
      errorResponses: [createErrorResponse(403), createErrorResponse(404)]
    });

    new s3d.BucketDeployment(this, 'BucketDeployment', {
      distribution,
      distributionPaths: ['/*'],
      destinationBucket: websiteBucket,
      destinationKeyPrefix: this.originPath,
      sources: fs.existsSync(BUILD_PATH) ? [s3d.Source.asset(BUILD_PATH)] : []
    });

    if (deployConfig) {
      const distroTarget = new targets.CloudFrontTarget(distribution);
      const aliasRecordProps: route53.ARecordProps | route53.AaaaRecordProps = {
        target: route53.RecordTarget.fromAlias(distroTarget),
        zone: deployConfig.hostedZone,
        recordName: deployConfig.siteDomain,
        deleteExisting: false
      };

      // Route traffic to an IPv4-enabled distribution
      new route53.ARecord(
        this,
        `${deployConfig.siteDomain}-Alias-ARecord`,
        aliasRecordProps
      );

      // Route traffic to an IPv6-enabled distribution
      new route53.AaaaRecord(
        this,
        `${deployConfig.siteDomain}-Alias-AAAARecord`,
        aliasRecordProps
      );
    }

    new CfnOutput(this, 'distributionDomainName', {
      value: distribution.distributionDomainName
    });

    if (deployConfig) {
      const siteURL = `https://${deployConfig.siteDomain}`;
      new CfnOutput(this, 'siteURL', { value: siteURL });
    }

    if (this.buildVersion) {
      new CfnOutput(this, 'buildVersion', { value: this.buildVersion });
    }
  }

  lookupHostedZone(domainName: string): route53.IHostedZone {
    return route53.HostedZone.fromLookup(this, 'HostedZone', { domainName });
  }

  importCertificate(id: string, certificateArn: string) {
    return acm.Certificate.fromCertificateArn(this, id, certificateArn);
  }
}

export default WebsiteStack;
