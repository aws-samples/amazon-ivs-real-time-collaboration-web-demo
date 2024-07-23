import { getMeetingMessage } from '@Content';
import { MeetingParticipantInfo } from '@Shared/types';
import { clsm } from '@Utils';

import ParticipantAvatarStack from '../../ParticipantAvatarStack';

interface ParticipantAvatarStackPanelProps {
  participants: MeetingParticipantInfo[];
}

const MAX_STACK_LENGTH = 5;

function ParticipantAvatarStackPanel({
  participants
}: ParticipantAvatarStackPanelProps) {
  const avatarParticipants = participants.slice(0, MAX_STACK_LENGTH);
  const extraParticipants = participants.slice(MAX_STACK_LENGTH);
  const extraParticipantsCount = extraParticipants.length;
  const totalParticipantsCount = participants.length;

  return (
    <div
      className={clsm([
        'absolute',
        'top-1/2',
        'left-1/2',
        '-translate-x-1/2',
        '-translate-y-1/2',
        'w-full',
        'h-auto',
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'gap-4',
        'text-center',
        'font-semibold'
      ])}
    >
      <ParticipantAvatarStack
        participants={avatarParticipants}
        className={clsm([
          'w-[50%]',
          'hidden',
          '@[11rem]:grid',
          '[&>img]:ring-zinc-300',
          '[&>img]:dark:ring-zinc-800'
        ])}
      />
      {extraParticipantsCount > 0 && (
        <span className={clsm(['@[11rem]:block', 'hidden'])}>
          +
          {extraParticipantsCount === 1
            ? getMeetingMessage('otherParticipant')
            : getMeetingMessage('otherParticipants', {
                participantsCount: extraParticipantsCount.toString()
              })}
        </span>
      )}
      {totalParticipantsCount > 0 && (
        <span className={clsm(['@[11rem]:hidden', 'block'])}>
          {totalParticipantsCount === 1
            ? getMeetingMessage('otherParticipant')
            : getMeetingMessage('otherParticipants', {
                participantsCount: totalParticipantsCount.toString()
              })}
        </span>
      )}
    </div>
  );
}

export default ParticipantAvatarStackPanel;
