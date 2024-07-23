import { cognitoSdk } from '@Lambda/sdk';
import { CognitoException } from '@Shared/types';
import { PreSignUpTriggerEvent } from 'aws-lambda';

const allowedSignUpDomains = process.env.ALLOWED_SIGN_UP_DOMAINS?.split(',');

async function handler(event: PreSignUpTriggerEvent) {
  const { userPoolId, request, response } = event;
  const userEmail = request.userAttributes.email;
  const users = await cognitoSdk.listUsersByEmail(userPoolId, userEmail);

  if (users.length > 0) {
    throw new Error(CognitoException.EMAIL_EXISTS, { cause: userEmail });
  }

  if (allowedSignUpDomains) {
    const userEmailDomain = userEmail.split('@')[1];
    const isSignUpAllowed = allowedSignUpDomains.some(
      (allowedSignUpDomain) => allowedSignUpDomain === userEmailDomain
    );

    if (!isSignUpAllowed) {
      throw new Error(CognitoException.EMAIL_DOMAIN_FORBIDDEN, {
        cause: { userEmail, allowedSignUpDomains }
      });
    }
  }

  response.autoConfirmUser = true; // eslint-disable-line no-param-reassign
  response.autoVerifyEmail = true; // eslint-disable-line no-param-reassign

  return event;
}

export { handler };
