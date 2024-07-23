import { getMeetingMessage } from '@Content';
import { useStageManager } from '@Contexts/StageManager';
import { clsm } from '@Utils';

import { ParticipantList } from '../../../components';
import InfoCard from './InfoCard';

interface PeopleSidebarProps {
  isVisible?: boolean;
}

function PeopleSidebar({ isVisible = true }: PeopleSidebarProps) {
  const { host, pathname, href } = window.location;
  const { user: userStage } = useStageManager();
  const publishingUserParticipants = userStage.getParticipants({
    isPublishing: true
  });
  const subscribeOnlyUserParticipants = userStage.getParticipants({
    isPublishing: false
  });

  return (
    <div className={clsm(['w-full', !isVisible && 'hidden'])}>
      <InfoCard
        title={getMeetingMessage('inviteToStage')}
        message={`${host}${pathname}`}
        copy={href}
      />
      <div className={clsm(['p-4', 'space-y-6'])}>
        <ParticipantList
          title={getMeetingMessage('onThisStage')}
          participants={publishingUserParticipants}
        />
        <ParticipantList
          title={getMeetingMessage('viewers')}
          participants={subscribeOnlyUserParticipants}
        />
      </div>
    </div>
  );
}

export default PeopleSidebar;
