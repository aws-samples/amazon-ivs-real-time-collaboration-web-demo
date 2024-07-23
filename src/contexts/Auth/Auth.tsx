import { useContextHook } from '@Hooks';
import { authLoader } from '@Utils/loaders';
import { AuthUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { createContext, useEffect } from 'react';
import { Outlet, useLoaderData } from 'react-router-dom';
import useSWR from 'swr';

import Authenticate from './Authenticate';

const Context = createContext<AuthUser | null>(null);
Context.displayName = 'Auth';

function useAuth() {
  return useContextHook(Context);
}

function AuthProvider() {
  const { data: authUser, mutate: setAuthUser } = useSWR('auth', authLoader, {
    fallbackData: useLoaderData() as AuthUser | null
  });

  useEffect(
    () =>
      Hub.listen('auth', ({ payload }) => {
        if (payload.event === 'signedIn') {
          setAuthUser(payload.data, { revalidate: false });
        }

        if (payload.event === 'signedOut') {
          setAuthUser(null, { revalidate: false });
        }
      }),
    [setAuthUser]
  );

  return (
    <Context.Provider value={authUser}>
      {authUser ? <Outlet /> : <Authenticate />}
    </Context.Provider>
  );
}

export { AuthProvider, useAuth };
