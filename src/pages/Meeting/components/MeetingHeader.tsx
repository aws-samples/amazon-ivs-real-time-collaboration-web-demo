import { IconCameraOff, IconVisibility } from '@Assets/icons';
import { InfoPill, Tooltip } from '@Components';
import { getMeetingMessage } from '@Content';
import { useStageManager } from '@Contexts/StageManager';
import { useBreakpoint, useLocalStorage } from '@Hooks';
import { JoinResponse } from '@Shared/types';
import { clsm } from '@Utils';
import { useEffect, useRef, useState } from 'react';
import { useAsyncValue } from 'react-router-dom';

const dateTimeFormatter = new Intl.DateTimeFormat([], { timeStyle: 'medium' });
function getCurrentTime() {
  return dateTimeFormatter.format(new Date());
}

function MeetingHeader() {
  const { meetingId } = useAsyncValue() as JoinResponse;
  const { user: userStage } = useStageManager();
  const [audioOnly] = useLocalStorage('audioOnly');
  const [currentTime, setCurrentTime] = useState(getCurrentTime);
  const currentTimeIntervalRef = useRef<NodeJS.Timeout>();
  const hideTextInfo = useBreakpoint('sm');

  useEffect(() => {
    if (userStage.subscribeOnly) return;

    currentTimeIntervalRef.current = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => {
      clearInterval(currentTimeIntervalRef.current);
    };
  }, [userStage.subscribeOnly]);

  return (
    <header
      className={clsm([
        'grid',
        'p-4',
        'gap-2',
        'w-full',
        'grid-cols-[1fr_auto_1fr]'
      ])}
    >
      <span />
      <div className={clsm(['flex', 'gap-x-2'])}>
        {userStage.subscribeOnly ? (
          <InfoPill
            text={hideTextInfo ? undefined : getMeetingMessage('viewerMode')}
            className={clsm(['truncate', 'max-w-xs'])}
            Icon={IconVisibility}
          />
        ) : (
          <InfoPill className="xs:hidden" text={currentTime} />
        )}
        <Tooltip
          id="audioOnlyMode"
          disabled={!audioOnly}
          content={getMeetingMessage('incomingVideoTurnedOff')}
        >
          <InfoPill
            {...(audioOnly && { Icon: IconCameraOff })}
            text={hideTextInfo && audioOnly ? undefined : meetingId}
            className={clsm(['truncate', 'max-w-xs', '[&_svg]:fill-red-500'])}
          />
        </Tooltip>
      </div>
    </header>
  );
}

export default MeetingHeader;
