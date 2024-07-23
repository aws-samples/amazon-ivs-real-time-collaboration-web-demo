import { messagesApi } from '@Api';
import { getMeetingMessage } from '@Content';
import { CustomStageEvents } from '@Contexts/StageManager';
import { MeetingParticipantInfo, ParticipantGroup } from '@Shared/types';
import { clsm } from '@Utils';

async function freeSlot(
  meetingId: string,
  freeSlotParticipant: MeetingParticipantInfo
) {
  const { id: recipientId } = freeSlotParticipant;
  const msgDest = { meetingId, recipientId };
  const msgEvent = CustomStageEvents.STAGE_PARTICIPANT_SHOULD_UNPUBLISH;

  await Promise.all([
    messagesApi.dismissNotif('freeSlot', msgDest),
    messagesApi.sendEvent({ ...msgDest, event: msgEvent })
  ]);
}

async function notifyFreeSlot(
  meetingId: string,
  freeSlotParticipant: MeetingParticipantInfo
) {
  const { id: recipientId, attributes } = freeSlotParticipant;

  await messagesApi.sendNotif({
    meetingId,
    recipientId,
    type: 'loading',
    text:
      attributes.participantGroup === ParticipantGroup.DISPLAY
        ? getMeetingMessage('yourScreenShareWillEnd')
        : getMeetingMessage('youAreBeingMovedToViewOnly'),
    attributes: JSON.stringify({
      toastOptions: {
        id: 'freeSlot',
        duration: 60_000,
        className: clsm([
          '!bg-red-600',
          '!text-white',
          '[&_#spinner]:!text-white'
        ])
      }
    })
  });
}

async function dismissFreeSlot(
  meetingId: string,
  freeSlotParticipant: MeetingParticipantInfo
) {
  const { id: recipientId, attributes } = freeSlotParticipant;

  await messagesApi.sendNotif({
    meetingId,
    recipientId,
    type: 'success',
    text:
      attributes.participantGroup === ParticipantGroup.DISPLAY
        ? getMeetingMessage('yourScreenShareWillEndCancelled')
        : getMeetingMessage('youAreBeingMovedToViewOnlyCancelled'),
    attributes: JSON.stringify({
      toastOptions: {
        id: 'freeSlot',
        className: clsm([
          '!bg-green-800',
          '!text-white',
          '[&_#spinner]:!text-white'
        ])
      }
    })
  });
}

export { dismissFreeSlot, freeSlot, notifyFreeSlot };
