import { useMap, useMeeting } from '@Hooks';
import {
  GetMeetingResponse,
  MeetingParticipantInfo,
  StageClientConfig
} from '@Shared/types';
import { StageParticipantInfo } from 'amazon-ivs-web-broadcast';
import { useCallback, useMemo } from 'react';

type Participants = ReadonlyMap<string, MeetingParticipantInfo>;

function useParticipants(stageConfig: StageClientConfig) {
  const { participantGroup, participantId: localParticipantId } = stageConfig;
  const [stageParticipants, stageParticipantsMutators] =
    useMap<StageParticipantInfo>();
  const [meeting, mutateMeeting] = useMeeting();
  const meetingParticipantsInfo = meeting.participants?.[participantGroup];

  const participants = useMemo<Participants>(() => {
    // Initialize from the stage participants map to preserve insertion order
    const participantsMap = new Map(stageParticipants as Participants);

    // Augment participantsMap with the meeting participant info retrieved from the backend
    if (meetingParticipantsInfo) {
      Object.entries(meetingParticipantsInfo).forEach(([id, info]) => {
        participantsMap.set(id, { ...info, ...participantsMap.get(id) });
      });
    }

    // Ensure the local participant is the last participant in participantsMap
    const localParticipant = participantsMap.get(localParticipantId);
    if (localParticipant) {
      participantsMap.delete(localParticipant.id);
      participantsMap.set(localParticipant.id, localParticipant);
    }

    return participantsMap;
  }, [localParticipantId, meetingParticipantsInfo, stageParticipants]);

  const upsertParticipant = useCallback(
    async (participant: StageParticipantInfo) => {
      const { attributes, id: participantId } = participant;

      if (attributes.participantGroup !== participantGroup) {
        return;
      }

      await mutateMeeting(
        (currentData?: GetMeetingResponse) => {
          const mutatedData = structuredClone(currentData);

          if (mutatedData) {
            mutatedData.participants[participantGroup][participantId] = {
              ...mutatedData.participants[participantGroup][participantId],
              ...(participant as MeetingParticipantInfo)
            };
          }

          return mutatedData;
        },
        { revalidate: false }
      );

      stageParticipantsMutators.set(participantId, (prevParticipant) => ({
        ...prevParticipant,
        ...participant
      }));
    },
    [mutateMeeting, participantGroup, stageParticipantsMutators]
  );

  const removeParticipant = useCallback(
    async (participant: StageParticipantInfo) => {
      const { attributes, id: participantId } = participant;

      if (attributes.participantGroup !== participantGroup) {
        return;
      }

      await mutateMeeting(
        (currentData?: GetMeetingResponse) => {
          const mutatedData = structuredClone(currentData);

          if (mutatedData) {
            delete mutatedData.participants[participantGroup][participantId];
          }

          return mutatedData;
        },
        { revalidate: false }
      );

      stageParticipantsMutators.remove(participantId);
    },
    [mutateMeeting, participantGroup, stageParticipantsMutators]
  );

  return {
    participants,
    upsertParticipant,
    removeParticipant,
    resetParticipants: stageParticipantsMutators.clear
  };
}

export default useParticipants;
