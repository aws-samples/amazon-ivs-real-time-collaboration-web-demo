import { ddbSdk } from '@Lambda/sdk';
import { APIException } from '@Lambda/types';
import { createErrorResponse, createSuccessResponse } from '@Lambda/utils';
import {
  GetMeetingResponse,
  MeetingParticipant,
  MeetingParticipants,
  ParticipantGroup
} from '@Shared/types';
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWithCognitoAuthorizerEvent
} from 'aws-lambda';

async function handler(
  event: APIGatewayProxyWithCognitoAuthorizerEvent
): Promise<APIGatewayProxyResultV2> {
  const meetingId = event.pathParameters!.proxy as string;
  let response: GetMeetingResponse;

  console.info('[EVENT]', JSON.stringify(event));

  try {
    const meetingRecord = await ddbSdk.getMeetingRecord(meetingId);

    if (!meetingRecord) {
      return createErrorResponse({
        code: 404,
        name: APIException.MEETING_NOT_FOUND,
        message: `No meeting exists with the meeting ID or alias "${meetingId}"`
      });
    }

    console.info('Found meeting record', meetingRecord);

    const {
      id,
      alias,
      stageArn,
      createdAt,
      activeSessionId,
      participantAttributes,
      publishers = new Set(),
      subscribers = new Set()
    } = meetingRecord;
    const isActive = !!activeSessionId;

    const participants: MeetingParticipants = {
      [ParticipantGroup.USER]: {},
      [ParticipantGroup.DISPLAY]: {}
    };

    Array.from(subscribers).forEach((participantId) => {
      const attributes = participantAttributes[participantId];
      const isPublishing = publishers.has(participantId);
      const participant: MeetingParticipant = {
        isPublishing,
        attributes,
        id: participantId
      };

      participants[attributes.participantGroup][participantId] = participant;
    });

    response = {
      id,
      alias,
      stageArn,
      createdAt,
      isActive,
      participants
    };
  } catch (error) {
    console.error(error);

    return createErrorResponse({ message: 'Failed to get meeting details.' });
  }

  console.info('[RESPONSE]', response);

  return createSuccessResponse({ body: response });
}

export { handler };
