import { PageSpinner } from '@Components';
import { AuthProvider } from '@Contexts/Auth';
import { BroadcastProvider } from '@Contexts/Broadcast';
import { ChatProvider } from '@Contexts/Chat';
import { DeviceManagerProvider } from '@Contexts/DeviceManager';
import { StageManagerProvider } from '@Contexts/StageManager';
import { localStorageProvider } from '@LocalStorage';
import { Landing, Meeting } from '@Pages';
import { JoinResponse } from '@Shared/types';
import {
  authLoader,
  landingLoader,
  meetingLoader,
  MeetingLoaderData
} from '@Utils/loaders';
import { AxiosError } from 'axios';
import { Suspense } from 'react';
import {
  Await,
  createBrowserRouter,
  createRoutesFromElements,
  generatePath,
  matchRoutes,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  UIMatch,
  useAsyncError,
  useLoaderData,
  useLocation,
  useMatches
} from 'react-router-dom';
import { SWRConfig } from 'swr';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      loader={authLoader}
      element={
        <SWRConfig value={{ provider: localStorageProvider }}>
          <AuthProvider />
        </SWRConfig>
      }
    >
      <Route index loader={landingLoader} element={<Landing />} />
      <Route
        loader={meetingLoader}
        element={<MeetingLoader />}
        shouldRevalidate={() => false}
      >
        <Route
          path=":meetingId"
          element={
            <StageManagerProvider>
              <DeviceManagerProvider>
                <BroadcastProvider>
                  <ChatProvider>
                    <Meeting />
                  </ChatProvider>
                </BroadcastProvider>
              </DeviceManagerProvider>
            </StageManagerProvider>
          }
          handle={{ errorReason: 'failedToJoinMeeting' }}
        />
        {/* 
          Uncomment to add a route used for debugging meetings.

          <Route
            path="debug/:meetingId"
            element={<Debug />}
            handle={{ errorReason: 'failedToLoadDebugger' }}
          /> 
        */}
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Route>
  )
);

function MeetingLoader() {
  const { joinResponse } = useLoaderData() as MeetingLoaderData;
  const location = useLocation();
  const routeMatches = matchRoutes(router.routes, location);
  const currRouteMatch = routeMatches?.at(-1);
  const currRoutePath = currRouteMatch?.route.path || '/';

  return (
    <Suspense fallback={<MeetingLoaderFallback />}>
      <Await resolve={joinResponse} errorElement={<MeetingLoaderError />}>
        {({ meetingId }: JoinResponse) => (
          <>
            {/* Navigate to the "cleaned" meeting ID from the join response */}
            <Navigate replace to={generatePath(currRoutePath, { meetingId })} />
            <Outlet />
          </>
        )}
      </Await>
    </Suspense>
  );
}

function MeetingLoaderFallback() {
  return <PageSpinner isLoading pageId="MeetingLoader" />;
}

function MeetingLoaderError() {
  const asyncError = useAsyncError();
  const isApiError = asyncError instanceof AxiosError;

  const matches = useMatches();
  const route = matches.at(-1) as UIMatch<unknown, { errorReason: string }>;
  const errorReason = route?.handle.errorReason;

  return isApiError && <Navigate replace to="/" state={{ errorReason }} />;
}

function App() {
  return (
    <RouterProvider
      router={router}
      fallbackElement={<PageSpinner isLoading pageId="Router" />}
    />
  );
}

export default App;
