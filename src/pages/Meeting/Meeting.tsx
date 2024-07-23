import { PageSpinner } from '@Components';
import { useBroadcast } from '@Contexts/Broadcast';
import { useChat } from '@Contexts/Chat';
import { useDeviceManager } from '@Contexts/DeviceManager';
import { StageFactory, useStageManager } from '@Contexts/StageManager';
import { useMount } from '@Hooks';
import { JoinResponse, ParticipantGroup } from '@Shared/types';
import { clsm, exhaustiveSwitchGuard } from '@Utils';
import { subscribeToMessages, unsubscribeFromMessages } from '@Utils/subs';
import {
  StageConnectionState,
  StageParticipantPublishState
} from 'amazon-ivs-web-broadcast';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncValue, useLocation } from 'react-router-dom';

import { MeetingToast } from './components';
import { MeetingEnded, MeetingPreview, MeetingRoom } from './pages';
import { MeetingPage } from './types';

const { CONNECTING } = StageConnectionState;
const { ATTEMPTING_PUBLISH } = StageParticipantPublishState;

function Meeting() {
  const { meetingId, stageConfigs } = useAsyncValue() as JoinResponse;
  const { userMedia, stopDevices } = useDeviceManager();
  const { stopBroadcast } = useBroadcast();
  const { user: userStage, display: displayStage } = useStageManager();
  const { connect: connectChat, disconnect: disconnectChat } = useChat();
  const { state: locationState } = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [meetingPage, setMeetingPage] = useState<MeetingPage>(
    locationState?.meetingPage || 'preview'
  );
  const initLocked = useRef(false);
  const isMounted = useMount();
  const isMeetingLoading =
    isInitializing ||
    userStage.connectState === CONNECTING ||
    displayStage.connectState === CONNECTING ||
    userStage.publishState === ATTEMPTING_PUBLISH;

  function renderMeetingPage() {
    switch (meetingPage) {
      case 'preview':
        return <MeetingPreview enterMeeting={enterMeeting} />;
      case 'room':
        return <MeetingRoom leaveMeeting={leaveMeeting} />;
      case 'ended':
        return <MeetingEnded />;
      default: {
        return exhaustiveSwitchGuard(meetingPage);
      }
    }
  }

  const enterMeeting = useCallback(
    async ({
      joinMuted = false,
      joinAsViewer = false,
      userStreamToPublish = userMedia.mediaStream
    }: {
      joinMuted?: boolean;
      joinAsViewer?: boolean;
      userStreamToPublish?: MediaStream;
    } = {}) => {
      const {
        [ParticipantGroup.USER]: { participantId: userParticipantId },
        [ParticipantGroup.DISPLAY]: { participantId: displayParticipantId }
      } = stageConfigs;

      try {
        if (joinMuted) userMedia.toggleAudio({ muted: true });

        await Promise.all([
          joinAsViewer ? userStage.join() : userStage.join(userStreamToPublish),
          displayStage.join()
        ]);

        if (joinAsViewer) stopDevices();

        connectChat();
        subscribeToMessages(meetingId, userParticipantId, userStage.emit);
        subscribeToMessages(meetingId, displayParticipantId, displayStage.emit);
        setMeetingPage('room');
      } catch (error) {
        StageFactory.leaveStages();
        setMeetingPage('preview');
      }
    },
    [
      meetingId,
      userMedia,
      userStage,
      displayStage,
      stageConfigs,
      connectChat,
      stopDevices
    ]
  );

  const leaveMeeting = useCallback(() => {
    StageFactory.leaveStages();
    stopDevices();
    stopBroadcast();
    disconnectChat();
    setMeetingPage('ended');
    unsubscribeFromMessages();
  }, [stopDevices, stopBroadcast, disconnectChat]);

  /**
   * Meeting initialization entry-point
   */
  useEffect(() => {
    if (initLocked.current) return;

    async function initMeeting() {
      /**
       * Start the user's device media
       */
      const userStreamToPublish = await userMedia.startUserMedia();

      /**
       * If the user is landing on the meeting room on mount,
       * then we will join the stage and chat room right away
       */
      if (isMounted() && meetingPage === 'room') {
        await enterMeeting({ userStreamToPublish });
      }

      /**
       * If the Meeting unmounts at any point during the preceding async operations,
       * then we will make sure to stop all actively running user devices
       */
      if (!isMounted()) stopDevices();

      setIsInitializing(false);
    }

    initLocked.current = true;
    initMeeting();
  }, [isMounted, meetingPage, enterMeeting, stopDevices, userMedia]);

  useEffect(() => unsubscribeFromMessages, []);

  return (
    <>
      <MeetingToast
        meetingPage={meetingPage}
        toastProps={{ containerClassName: '!top-[60px]' }}
      />
      <PageSpinner isLoading={isMeetingLoading} pageId="Meeting">
        <main
          className={clsm([
            'flex',
            'flex-col',
            'items-center',
            'justify-center',
            'h-dvh',
            'w-screen'
          ])}
        >
          {renderMeetingPage()}
        </main>
      </PageSpinner>
    </>
  );
}

export default Meeting;
