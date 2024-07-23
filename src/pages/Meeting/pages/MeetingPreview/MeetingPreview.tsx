import { Button } from '@Components';
import { getMeetingPreviewMessage } from '@Content';
import { useAuth } from '@Contexts/Auth';
import { ParticipantGroup } from '@Shared/types';
import { clsm } from '@Utils';
import { getComputedVideoAspectRatio, VideoAspectRatio } from '@Utils/layout';

import {
  MeetingControls,
  MeetingHeader,
  ParticipantVideoPreviewTile
} from '../../components';
import RemoteParticipantsPreview from './RemoteParticipantsPreview';

interface MeetingPreviewProps {
  enterMeeting: (options?: {
    joinMuted?: boolean;
    joinAsViewer?: boolean;
    userMediaStream?: MediaStream;
  }) => Promise<void>;
}

function MeetingPreview({ enterMeeting }: MeetingPreviewProps) {
  const authUser = useAuth();

  function joinNow() {
    enterMeeting();
  }

  function joinMuted() {
    enterMeeting({ joinMuted: true });
  }

  function joinAsViewer() {
    enterMeeting({ joinAsViewer: true });
  }

  return (
    <>
      <MeetingHeader />
      <section
        className={clsm([
          'flex',
          'w-full',
          'h-full',
          'pb-5',
          'lg:px-16',
          'overflow-y-auto'
        ])}
      >
        <div
          className={clsm([
            'grid',
            'grid-cols-1',
            'place-items-center',
            'px-10',
            'm-auto',
            'gap-x-10',
            'gap-y-5',
            'lg:px-4',
            'w-full',
            'max-w-6xl'
          ])}
        >
          <ParticipantVideoPreviewTile
            containerStyle={{
              aspectRatio: getComputedVideoAspectRatio(VideoAspectRatio.VIDEO)
            }}
            attributes={{
              picture: '',
              name: authUser.username,
              participantGroup: ParticipantGroup.USER
            }}
          />
          <div
            className={clsm([
              'flex',
              'flex-col',
              'items-center',
              'w-full',
              'space-y-3',
              'w-[275px]',
              'col-start-2',
              'lg:col-start-auto',
              'lg:row-start-3',
              'lg:max-w-[500px]',
              '[&>button]:w-full'
            ])}
          >
            <RemoteParticipantsPreview />
            <Button onClick={joinNow}>
              {getMeetingPreviewMessage('joinNow')}
            </Button>
            <Button onClick={joinMuted} variant="secondary">
              {getMeetingPreviewMessage('joinMuted')}
            </Button>
            <hr
              className={clsm(['w-1/4', 'bg-gray-200', 'dark:border-zinc-700'])}
            />
            <Button onClick={joinAsViewer} variant="secondary">
              {getMeetingPreviewMessage('joinAsViewer')}
            </Button>
          </div>
          <MeetingControls isPreview />
        </div>
      </section>
    </>
  );
}

export default MeetingPreview;
