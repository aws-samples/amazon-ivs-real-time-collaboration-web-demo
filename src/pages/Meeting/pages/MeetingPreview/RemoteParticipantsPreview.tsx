import { getMeetingPreviewMessage } from '@Content';
import { useStageManager } from '@Contexts/StageManager';
import { clsm } from '@Utils';
import Balancer from 'react-wrap-balancer';

import { ParticipantAvatarStack } from '../../components';

const MAX_STACK_LENGTH = 5;

function RemoteParticipantsPreview() {
  const { user: userStage } = useStageManager();
  const remoteUserParticipants = userStage.getParticipants();

  function getParticipantsInMeeting() {
    const [
      firstParticipant,
      secondParticipant,
      thirdParticipant,
      ...remainingParticipants
    ] = remoteUserParticipants;
    const remainingParticipantsCount = remainingParticipants.length;
    const substitutions = {
      firstParticipant: firstParticipant?.attributes.name,
      secondParticipant: secondParticipant?.attributes.name,
      thirdParticipant: thirdParticipant?.attributes.name,
      remainingParticipantsCount: remainingParticipantsCount?.toString()
    };

    switch (remoteUserParticipants.length) {
      case 0:
        return getMeetingPreviewMessage('noneAreHere');
      case 1:
        return getMeetingPreviewMessage('oneIsHere', substitutions);
      case 2:
        return getMeetingPreviewMessage('twoAreHere', substitutions);
      case 3:
        return getMeetingPreviewMessage('threeAreHere', substitutions);
      case 4:
        return getMeetingPreviewMessage('fourAreHere', substitutions);
      default:
        return getMeetingPreviewMessage('manyAreHere', substitutions);
    }
  }

  return (
    <div
      className={clsm([
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'gap-y-3',
        'pb-2'
      ])}
    >
      <ParticipantAvatarStack
        className="h-10"
        participants={remoteUserParticipants
          .slice(0, MAX_STACK_LENGTH)
          .reverse()}
      />
      <Balancer className={clsm(['text-center', 'font-bold'])}>
        {getParticipantsInMeeting()}
      </Balancer>
    </div>
  );
}

export default RemoteParticipantsPreview;
