import { IconDelete } from '@Assets/icons';
import { Modal } from '@Components';
import { getMeetingMessage } from '@Content';
import { useDeviceManager } from '@Contexts/DeviceManager';
import { useStageManager } from '@Contexts/StageManager';
import { MeetingParticipantInfo } from '@Shared/types';
import { clsm } from '@Utils';
import { useMemo } from 'react';

import ParticipantList from '../../ParticipantList';

interface FreeSlotProps {
  isOpen: boolean;
  onClose: () => void;
}

function FreeSlot({ isOpen, onClose }: FreeSlotProps) {
  const {
    displayMedia: { startScreenShare }
  } = useDeviceManager();
  const { user: userStage, display: displayStage } = useStageManager();

  const remotePublishingUserParticipants = userStage.getParticipants({
    isLocal: false,
    isPublishing: true,
    canSubscribeTo: true
  });
  const remotePublishingDisplayParticipants = displayStage.getParticipants({
    isLocal: false,
    isPublishing: true,
    canSubscribeTo: true
  });

  const freeableParticipants = useMemo(() => {
    const freeableUserParticipants = [];
    const freeableDisplayParticipants = [];

    for (const userParticipant of remotePublishingUserParticipants) {
      const associatedDisplayParticipant =
        remotePublishingDisplayParticipants.find(
          (displayParticipant) =>
            displayParticipant.userId === userParticipant.userId
        );

      if (associatedDisplayParticipant) {
        freeableDisplayParticipants.push(associatedDisplayParticipant);
      } else {
        freeableUserParticipants.push(userParticipant);
      }
    }

    return [...freeableDisplayParticipants, ...freeableUserParticipants];
  }, [remotePublishingDisplayParticipants, remotePublishingUserParticipants]);

  function onFreeSlotSelect(freeSlotParticipant: MeetingParticipantInfo) {
    startScreenShare(freeSlotParticipant);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getMeetingMessage('freeSlotTitle')}
    >
      <p
        className={clsm(['text-sm', 'font-medium', 'leading-[17.5px]', 'mb-6'])}
      >
        {getMeetingMessage('freeSlotDescription')}
      </p>
      <div
        className={clsm([
          'h-80',
          'overflow-auto',
          'scrollbar-stable',
          'scrollbar-mb-2',
          'pr-4',
          'pb-5',
          'pl-6',
          '-mx-6',
          '-mb-6'
        ])}
      >
        <ParticipantList
          participants={freeableParticipants}
          action={{
            handler: onFreeSlotSelect,
            buttonIcon: <IconDelete />,
            buttonClassName: clsm([
              'focus-visible:!text-white',
              'enabled:hover:!text-white',
              'focus-visible:!bg-red-600',
              'enabled:hover:!bg-red-600'
            ])
          }}
        />
      </div>
    </Modal>
  );
}

export default FreeSlot;
