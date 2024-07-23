import { MeetingParticipantInfo, ParticipantGroup } from '@Shared/types';
import {
  ChatError,
  ChatLogLevel,
  ChatMessage,
  ChatRoomListenerMap,
  ConnectionState,
  DeleteMessageEvent,
  DisconnectUserEvent
} from 'amazon-ivs-chat-messaging';

interface ChatProviderProps {
  children: React.ReactNode;
}

interface ChatContext {
  messages: ReadonlyMap<string, ChatMessage>;
  connectionState: ConnectionState;
  connectionError?: string;
  chatError?: ChatError;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => Promise<ChatMessage | undefined>;
  deleteMessage: (
    messageId: string,
    reason?: string
  ) => Promise<DeleteMessageEvent | undefined>;
  disconnectUser: (
    userId: string,
    reason?: string
  ) => Promise<DisconnectUserEvent | undefined>;
}

type ChatEventName = keyof ChatRoomListenerMap;
interface ChatEventData<E extends ChatEventName> {
  listener: ChatRoomListenerMap[E];
  removeListener: () => void;
}

type ChatParticipantInfo = {
  [T in ParticipantGroup]?: Pick<MeetingParticipantInfo, 'id'>;
};

interface ChatRoomOptions {
  logLevel?: ChatLogLevel;
  maxReconnectAttempts?: number;
  onChatError?: (error: ChatError) => void;
  onChatSuccess?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isChatError(error: any): error is ChatError {
  return error && error.errorCode;
}

export type {
  ChatContext,
  ChatEventData,
  ChatEventName,
  ChatParticipantInfo,
  ChatProviderProps,
  ChatRoomOptions
};

export { isChatError };
