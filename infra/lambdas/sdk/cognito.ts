import {
  CognitoIdentityProviderClient,
  ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient();

async function listUsersByEmail(userPoolId: string, email: string) {
  const { Users: users = [] } = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`
    })
  );

  return users;
}

export { listUsersByEmail };
