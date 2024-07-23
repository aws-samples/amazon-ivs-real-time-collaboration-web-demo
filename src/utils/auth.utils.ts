import { AuthUser, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

function waitForAuth() {
  return new Promise<AuthUser>((resolve) => {
    getCurrentUser()
      .then(resolve)
      .catch(() => {
        // Wait for user to sign in
        const stopListener = Hub.listen('auth', ({ payload }) => {
          if (payload.event === 'signedIn') {
            resolve(payload.data);
            stopListener();
          }
        });
      });
  });
}

// eslint-disable-next-line import/prefer-default-export
export { waitForAuth };
