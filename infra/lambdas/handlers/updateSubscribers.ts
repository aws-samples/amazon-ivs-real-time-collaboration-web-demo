import { ParticipantState } from '@aws-sdk/client-ivs-realtime';
import { ddbSdk, realTimeSdk } from '@Lambda/sdk';
import { ActiveMeetingRecord } from '@Lambda/types';
import { SQSEvent } from 'aws-lambda';

async function handler(event: SQSEvent) {
  const activeMeetings: ActiveMeetingRecord[] = event.Records.map(({ body }) =>
    JSON.parse(body)
  );

  await Promise.allSettled(
    activeMeetings.map(async (activeMeeting) => {
      const { id, activeSessionId, stageArn } = activeMeeting;
      let subscribers: Set<string> | undefined;

      try {
        const connectedParticipants = await realTimeSdk.listParticipants(
          stageArn,
          activeSessionId,
          ParticipantState.CONNECTED
        );

        subscribers = new Set(
          connectedParticipants.map(
            (participant) => participant.participantId as string
          )
        );
      } catch (error) {
        console.error(error);
        /**
         * Swallow the error to allow for the MeetingRecord update to proceed.
         * Doing so will change the updatedAt attribute and allow us to send a
         * subsequent SQS message to the queue for this meeting without having
         * to wait for the 5-minute message deduplication timeout to expire.
         */
      }

      try {
        await ddbSdk.updateMeetingRecord({
          id,
          onlyUpdateIfActive: true,
          attrsToSet: subscribers && { subscribers }
        });
      } catch (error) {
        console.error(error);
        // Swallow the error to continue processing remaining active meetings
      }
    })
  );
}

export { handler };
