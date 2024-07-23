import { aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

class EnhancedS3Bucket extends s3.Bucket {
  constructor(scope: Construct, id: string, props: s3.BucketProps) {
    const { bucketName, ...restProps } = props;

    super(scope, id, {
      bucketName: bucketName?.toLowerCase(),
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED, // Disable ACLs; use bucket policies to define access control
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      enforceSSL: true,
      versioned: true,
      ...restProps
    });
  }
}

export default EnhancedS3Bucket;
