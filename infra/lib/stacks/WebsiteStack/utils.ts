import { aws_cloudfront as cf, Duration } from 'aws-cdk-lib';

function createErrorResponse(httpStatus: number): cf.ErrorResponse {
  return {
    httpStatus,
    responseHttpStatus: 200,
    responsePagePath: '/index.html',
    ttl: Duration.seconds(10)
  };
}

export { createErrorResponse };
