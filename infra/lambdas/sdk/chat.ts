import {
  ChatTokenCapability,
  CreateChatTokenCommand,
  CreateRoomCommand,
  DeleteRoomCommand,
  IvschatClient
} from '@aws-sdk/client-ivschat';
import {
  CHAT_TOKEN_SESSION_DURATION_IN_MINUTES,
  RESOURCE_TAGS
} from '@Lambda/constants';
import { UserData } from '@Lambda/types';
import { retryWithBackoff } from '@Lambda/utils';

const ivsChatClient = new IvschatClient();

function createChatRoom() {
  return retryWithBackoff(() =>
    ivsChatClient.send(new CreateRoomCommand({ tags: RESOURCE_TAGS }))
  );
}

async function createToken(chatRoomArn: string, userData: UserData) {
  const { token, sessionExpirationTime, tokenExpirationTime } =
    await retryWithBackoff(() =>
      ivsChatClient.send(
        new CreateChatTokenCommand({
          roomIdentifier: chatRoomArn,
          capabilities: [ChatTokenCapability.SEND_MESSAGE],
          userId: userData.userId,
          sessionDurationInMinutes: CHAT_TOKEN_SESSION_DURATION_IN_MINUTES,
          attributes: {
            name: userData.name,
            picture: userData.picture
          }
        })
      )
    );

  return { token, sessionExpirationTime, tokenExpirationTime };
}

function deleteChatRoom(chatRoomArn: string) {
  return retryWithBackoff(() =>
    ivsChatClient.send(new DeleteRoomCommand({ identifier: chatRoomArn }))
  );
}

export { createChatRoom, createToken, deleteChatRoom };
