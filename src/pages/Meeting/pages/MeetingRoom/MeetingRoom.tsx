import sounds from '@Assets/sounds';
import { PageSpinner } from '@Components';
import { getMeetingMessage } from '@Content';
import { useDeviceManager } from '@Contexts/DeviceManager';
import { useStageManager } from '@Contexts/StageManager';
import { clsm } from '@Utils';
import { getComputedMeetingGridStyle } from '@Utils/layout';
import {
  StageConnectionState,
  StageEvents,
  StageParticipantInfo,
  StageParticipantPublishState
} from 'amazon-ivs-web-broadcast';
import { useCallback, useEffect, useState } from 'react';

import { MeetingHeader } from '../../components';
import { Sidebar } from '../../types';
import MeetingRoomFooter from './MeetingRoomFooter';
import MeetingRoomSidebars from './MeetingRoomSidebars';
import ParticipantsGrid from './ParticipantsGrid';

const { STAGE_PARTICIPANT_JOINED, STAGE_CONNECTION_STATE_CHANGED } =
  StageEvents;

interface MeetingRoomProps {
  leaveMeeting: () => void;
}

function MeetingRoom({ leaveMeeting }: MeetingRoomProps) {
  const { displayMedia } = useDeviceManager();
  const { user: userStage, display: displayStage } = useStageManager();
  const [activeSidebar, setActiveSidebar] = useState<Sidebar>(null);
  const isPublishingScreen =
    displayMedia.isScreenSharing &&
    displayStage.publishState !== StageParticipantPublishState.PUBLISHED;

  const userPublishers = userStage.getParticipants({
    isPublishing: true,
    canSubscribeTo: true
  });
  const displayPublishers = displayStage.getParticipants({
    isPublishing: true,
    canSubscribeTo: true
  });
  const isGridSpit = !!userPublishers.length && !!displayPublishers.length;
  const hasPublishers = !!userPublishers.length || !!displayPublishers.length;

  const changeSidebar = useCallback((sb: Sidebar) => {
    setActiveSidebar((prevSidebar) => (prevSidebar === sb ? null : sb));
  }, []);

  useEffect(() => {
    const addStgEventListener = userStage.on;
    const removeStgEventListener = userStage.off;

    function onJoin(participant: StageParticipantInfo) {
      if (!participant.isLocal && participant.isPublishing) {
        sounds.howl?.play('connectedRemote');
      }
    }

    function onConnectionChange(state: StageConnectionState) {
      if (state === StageConnectionState.DISCONNECTED) {
        sounds.howl?.play('disconnectedLocal');
      }
    }

    const connectedLocalSoundId = sounds.howl?.play('connectedLocal');
    addStgEventListener(STAGE_PARTICIPANT_JOINED, onJoin);
    addStgEventListener(STAGE_CONNECTION_STATE_CHANGED, onConnectionChange);

    return () => {
      sounds.howl?.stop(connectedLocalSoundId);
      removeStgEventListener(STAGE_PARTICIPANT_JOINED, onJoin);
      removeStgEventListener(
        STAGE_CONNECTION_STATE_CHANGED,
        onConnectionChange
      );
    };
  }, [userStage.on, userStage.off]);

  return (
    <>
      <MeetingHeader />
      <PageSpinner
        unmount={false}
        pageId="MeetingRoom"
        isLoading={isPublishingScreen}
        loadingText={getMeetingMessage('publishingScreen')}
      >
        <section
          className={clsm([
            'grid',
            'w-full',
            'h-full',
            'overflow-hidden',
            'ease-in-out',
            'transition-[grid]',
            activeSidebar ? 'grid-cols-[auto_360px]' : 'grid-cols-[auto_0px]'
          ])}
        >
          <div
            style={getComputedMeetingGridStyle(isGridSpit)}
            className={clsm(['grid', 'overflow-hidden', 'place-items-center'])}
          >
            <ParticipantsGrid isScreen participants={displayPublishers} />
            <ParticipantsGrid participants={userPublishers} />
            {!hasPublishers && (
              <h3 className="text-center">
                {getMeetingMessage('noContributors')}
              </h3>
            )}
          </div>
          <MeetingRoomSidebars
            activeSidebar={activeSidebar}
            changeSidebar={changeSidebar}
          />
        </section>
        <MeetingRoomFooter
          activeSidebar={activeSidebar}
          changeSidebar={changeSidebar}
          leaveMeeting={leaveMeeting}
        />
      </PageSpinner>
    </>
  );
}

export default MeetingRoom;
