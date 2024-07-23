import { StageEndpoints } from '@aws-sdk/client-ivs-realtime';
import { chatSdk, ddbSdk, realTimeSdk } from '@Lambda/sdk';
import { JoinMeetingBody, MeetingRecord } from '@Lambda/types';
import {
  cleanMeetingAlias,
  createErrorResponse,
  createMeetingIdFromStageArn,
  createSuccessResponse,
  getUserData,
  hyphenify,
  parseArn
} from '@Lambda/utils';
import {
  JoinResponse,
  ParticipantGroup,
  StageClientConfig
} from '@Shared/types';
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWithCognitoAuthorizerEvent
} from 'aws-lambda';

async function createMeeting(meetingAlias?: string) {
  const [stage, chatRoom] = await Promise.all([
    realTimeSdk.createStage(),
    chatSdk.createChatRoom()
  ]);

  const stageArn = stage.arn as string;
  const meetingId = createMeetingIdFromStageArn(stageArn); // e.g. abcd-1234-e5f6
  const cleanedMeetingAlias = meetingAlias
    ? cleanMeetingAlias(meetingAlias) // e.g. my-meeting
    : parseArn(stageArn).resourceId.toLowerCase(); // e.g. abcd1234e5f6

  return ddbSdk.createMeetingRecord({
    stageArn,
    id: meetingId,
    alias: cleanedMeetingAlias,
    chatRoomArn: chatRoom.arn as string,
    stageEndpoints: stage.endpoints as StageEndpoints
  });
}

async function handler(
  event: APIGatewayProxyWithCognitoAuthorizerEvent
): Promise<APIGatewayProxyResultV2> {
  const { meetingId }: JoinMeetingBody = JSON.parse(event.body || '{}');
  const userData = getUserData(event);
  let response: JoinResponse;

  console.info('[EVENT]', JSON.stringify(event));

  try {
    let meetingRecord: MeetingRecord | undefined;

    if (meetingId) {
      console.info(`Checking if a meeting record exists for "${meetingId}".`);
      meetingRecord = await ddbSdk.getMeetingRecord(meetingId);
    }

    if (meetingRecord) {
      console.info('Found meeting record', meetingRecord);
    } else {
      console.info(`Creating new meeting ("${meetingId || 'xxxx-xxxx-xxxx'}")`);
      meetingRecord = await createMeeting(meetingId);
    }

    console.info('Generating user and display stage participant tokens.');
    const participantTokens = await Promise.all(
      [ParticipantGroup.USER, ParticipantGroup.DISPLAY].map(
        (participantGroup) =>
          realTimeSdk.createToken({
            userData,
            participantGroup,
            stageArn: meetingRecord.stageArn,
            stageEndpoints: meetingRecord.stageEndpoints
          })
      )
    );

    await Promise.all(
      participantTokens.map(({ participantId, attributes }) =>
        ddbSdk.updateMeetingParticipant({
          id: meetingRecord.id,
          participant: { participantId, attributes }
        })
      )
    );

    const stageConfigs: Record<string, StageClientConfig> = {};
    for (const { token, participantId, attributes } of participantTokens) {
      const { participantGroup } = attributes;
      stageConfigs[participantGroup] = {
        token,
        participantId,
        participantGroup
      };
    }

    response = {
      stageConfigs,
      stageArn: meetingRecord.stageArn,
      meetingId:
        hyphenify(meetingRecord.alias) === meetingRecord.id
          ? meetingRecord.id
          : meetingRecord.alias
    };
  } catch (error) {
    console.error(error);

    return createErrorResponse({ message: 'Failed to join/create meeting.' });
  }

  console.info('[RESPONSE]', response);

  return createSuccessResponse({ body: response });
}

export { handler };
