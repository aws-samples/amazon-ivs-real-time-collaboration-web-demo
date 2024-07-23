import { CreateChatTokenResponse } from '@aws-sdk/client-ivschat';
import { chatSdk, ddbSdk } from '@Lambda/sdk';
import { APIException, CreateChatTokenBody } from '@Lambda/types';
import {
  createErrorResponse,
  createSuccessResponse,
  getUserData
} from '@Lambda/utils';
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWithCognitoAuthorizerEvent
} from 'aws-lambda';

async function handler(
  event: APIGatewayProxyWithCognitoAuthorizerEvent
): Promise<APIGatewayProxyResultV2> {
  const { meetingId }: CreateChatTokenBody = JSON.parse(event.body || '{}');
  const userData = getUserData(event);
  let response: CreateChatTokenResponse;

  console.info('[EVENT]', JSON.stringify(event));

  // Check required input
  if (!meetingId) {
    return createErrorResponse({
      code: 400,
      name: APIException.BAD_INPUT,
      message: 'Missing meetingId'
    });
  }

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

    response = await chatSdk.createToken(meetingRecord.chatRoomArn, userData);
  } catch (error) {
    console.error(error);

    return createErrorResponse({ message: 'Failed to create chat token.' });
  }

  console.info('[RESPONSE]', response);

  return createSuccessResponse({ body: response });
}

export { handler };
