import { Avatar, Button } from '@Components';
import { getMeetingMessage } from '@Content';
import { MeetingParticipantInfo, ParticipantGroup } from '@Shared/types';
import { clsm } from '@Utils';

interface ParticipantItemAction {
  buttonIcon: JSX.Element;
  buttonClassName?: string;
  handler: (participant: MeetingParticipantInfo) => void;
}

interface ParticipantListProps {
  title?: string;
  action?: ParticipantItemAction;
  participants: MeetingParticipantInfo[];
}

function ParticipantList({
  title,
  action,
  participants
}: ParticipantListProps) {
  return participants.length > 0 ? (
    <div
      className={clsm([
        'flex',
        'flex-col',
        'gap-y-3',
        'text-sm',
        'font-medium'
      ])}
    >
      {title}
      {participants.map((participant) => {
        const { id, attributes } = participant;
        const { picture, name, participantGroup } = attributes;

        return (
          <div
            key={id}
            className={clsm([
              'flex',
              'items-center',
              'justify-between',
              'gap-x-4',
              'h-[42px]'
            ])}
          >
            <Avatar className="h-9" src={picture} name={name} />
            <div
              className={clsm([
                'flex',
                'flex-col',
                'grow',
                'overflow-hidden',
                '[&>*]:truncate'
              ])}
            >
              {name}
              {participantGroup === ParticipantGroup.DISPLAY && (
                <span
                  className={clsm(['text-xs', 'font-normal', 'opacity-50'])}
                >
                  {getMeetingMessage('presentation')}
                </span>
              )}
            </div>
            {action && (
              <Button
                isIcon
                variant="transparent"
                className={action.buttonClassName}
                onClick={() => action.handler(participant)}
              >
                {action.buttonIcon}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  ) : null;
}

export default ParticipantList;
