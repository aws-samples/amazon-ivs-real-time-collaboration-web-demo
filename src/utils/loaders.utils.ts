import { meetingsApi } from '@Api';
import { StageFactory } from '@Contexts/StageManager';
import { JoinResponse } from '@Shared/types';
import { waitForAuth } from '@Utils/auth';
import { getCurrentUser } from 'aws-amplify/auth';
import { defer, LoaderFunctionArgs, redirect } from 'react-router-dom';

interface MeetingLoaderData {
  joinResponse: PromiseLike<JoinResponse>;
}

async function authLoader() {
  try {
    return await getCurrentUser();
  } catch (error) {
    return null;
  }
}

function landingLoader() {
  StageFactory.destroyStages();

  return null;
}

function meetingLoader({ params, request }: LoaderFunctionArgs) {
  try {
    const { searchParams } = new URL(request.url);
    const createNewMeeting = searchParams.get('new_stage') === 'true';

    return defer({
      joinResponse: waitForAuth().then(() =>
        createNewMeeting
          ? meetingsApi.joinMeeting()
          : meetingsApi.joinMeeting(params.meetingId)
      )
    });
  } catch (error) {
    return redirect('/');
  }
}

export type { MeetingLoaderData };

export { authLoader, landingLoader, meetingLoader };
