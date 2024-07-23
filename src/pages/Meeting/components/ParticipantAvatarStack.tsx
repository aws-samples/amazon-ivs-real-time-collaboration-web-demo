import { Avatar } from '@Components';
import { MeetingParticipantInfo } from '@Shared/types';
import { clsm } from '@Utils';

interface ParticipantAvatarStackProps {
  participants: MeetingParticipantInfo[];
  className?: string;
}

function ParticipantAvatarStack({
  participants,
  className
}: ParticipantAvatarStackProps) {
  return participants.length > 0 ? (
    <div className={clsm(['grid', 'place-content-center', className])}>
      {participants.map((participant, i) => (
        <Avatar
          key={participant.id}
          className={clsm([
            'overflow-hidden',
            'row-span-full',
            'col-span-2',
            'ring-4',
            'ring-gray-50',
            'dark:ring-zinc-900'
          ])}
          style={{ gridColumnStart: i + 1 }}
          name={participant.attributes.name}
          src={participant.attributes.picture}
        />
      ))}
    </div>
  ) : null;
}

export default ParticipantAvatarStack;
