import { meetingsApi } from '@Api';
import { noop } from '@Utils';
import {
  ChatRoom as IvsChatRoom,
  ChatRoomListenerMap,
  DeleteMessageRequest,
  DisconnectUserRequest,
  SendMessageRequest
} from 'amazon-ivs-chat-messaging';

import {
  ChatEventData,
  ChatEventName,
  ChatParticipantInfo,
  ChatRoomOptions,
  isChatError
} from './types';

const defaultOptions: Required<ChatRoomOptions> = {
  logLevel: 'error',
  maxReconnectAttempts: 10,
  onChatError: noop,
  onChatSuccess: noop
};

class ChatRoom {
  private readonly room: IvsChatRoom;

  private readonly events = new Map<
    ChatEventName,
    ChatEventData<ChatEventName>
  >();

  private participantInfo: ChatParticipantInfo = {};

  private options: Required<ChatRoomOptions>;

  constructor({
    meetingId,
    eventMap = {},
    options = defaultOptions
  }: {
    meetingId: string;
    eventMap: Partial<ChatRoomListenerMap>;
    options?: ChatRoomOptions;
  }) {
    this.options = { ...options, ...defaultOptions };

    // Create chat room
    this.room = new IvsChatRoom({
      id: `${meetingId}-room`,
      regionOrUrl: process.env.API_REGION,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      tokenProvider: () => meetingsApi.createChatToken(meetingId)
    });
    this.room.logLevel = this.options.logLevel;

    // Register event listeners
    Object.entries(eventMap).forEach(([eventName, listener]) => {
      const removeListener = this.room.addListener(
        eventName as ChatEventName,
        listener
      );
      this.events.set(eventName as ChatEventName, {
        listener,
        removeListener
      });
    });

    this.getState = this.getState.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    this.removeAllListeners = this.removeAllListeners.bind(this);
  }

  public set chatParticipantInfo(participantInfo: ChatParticipantInfo) {
    this.participantInfo = { ...this.participantInfo, ...participantInfo };
  }

  public getState() {
    return this.room.state;
  }

  public connect() {
    this.room.connect();
  }

  public disconnect() {
    this.room.disconnect();
  }

  public removeAllListeners() {
    this.events.forEach(({ removeListener }) => removeListener());
  }

  public async sendMessage(message: string) {
    const {
      participantInfo,
      options: { onChatSuccess, onChatError }
    } = this;
    const attributes = { participantInfo: JSON.stringify(participantInfo) };

    try {
      const request = new SendMessageRequest(message, attributes);
      const response = await this.room.sendMessage(request);
      onChatSuccess();

      return response;
    } catch (error) {
      console.error(error);

      if (isChatError(error)) {
        onChatError(error);
      }
    }
  }

  public async deleteMessage(messageId: string, reason?: string) {
    const {
      options: { onChatSuccess, onChatError }
    } = this;

    try {
      const request = new DeleteMessageRequest(messageId, reason);
      const response = await this.room.deleteMessage(request);
      onChatSuccess();

      return response;
    } catch (error) {
      console.error(error);

      if (isChatError(error)) {
        onChatError(error);
      }
    }
  }

  public async disconnectUser(userId: string, reason?: string) {
    const {
      options: { onChatSuccess, onChatError }
    } = this;

    try {
      const request = new DisconnectUserRequest(userId, reason);
      const response = await this.room.disconnectUser(request);
      onChatSuccess();

      return response;
    } catch (error) {
      console.error(error);

      if (isChatError(error)) {
        onChatError(error);
      }
    }
  }
}

export default ChatRoom;
