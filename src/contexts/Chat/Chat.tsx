import { useContextHook, useMap } from '@Hooks';
import { JoinResponse, ParticipantGroup } from '@Shared/types';
import {
  ChatError,
  ChatMessage,
  ConnectionState,
  DeleteMessageEvent,
  DisconnectReason
} from 'amazon-ivs-chat-messaging';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useAsyncValue } from 'react-router-dom';

import ChatRoom from './ChatRoom';
import { ChatContext, ChatProviderProps } from './types';

const Context = createContext<ChatContext | null>(null);
Context.displayName = 'Chat';

function useChat() {
  return useContextHook(Context);
}

function ChatProvider({ children }: ChatProviderProps) {
  const { meetingId, stageConfigs } = useAsyncValue() as JoinResponse;
  const {
    [ParticipantGroup.USER]: { participantId: localUserParticipantId },
    [ParticipantGroup.DISPLAY]: { participantId: localDisplayParticipantId }
  } = stageConfigs;
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string>();
  const [chatError, setChatError] = useState<ChatError>();
  const [messages, messagesActions] = useMap<ChatMessage>();

  const chatRoom = useMemo(() => {
    function connect() {
      setConnectionState('connected');
      setConnectionError('');
    }

    function connecting() {
      setConnectionState('connecting');
    }

    function disconnect(reason: DisconnectReason) {
      setConnectionState('disconnected');

      if (reason === 'clientDisconnect') {
        // Clean disconnect (by client)
        messagesActions.clear();
      } else if (reason === 'socketError' || reason === 'fetchTokenError') {
        // Dirty disconnect
        setConnectionError(reason);
      }
    }

    function message(msg: ChatMessage) {
      messagesActions.set(msg.id, msg);
    }

    function messageDelete(event: DeleteMessageEvent) {
      messagesActions.remove(event.id);
    }

    function onChatSuccess() {
      setChatError(undefined);
    }

    function onChatError(error: ChatError) {
      setChatError(error);
    }

    return new ChatRoom({
      meetingId: meetingId as string,
      eventMap: { connect, connecting, disconnect, message, messageDelete },
      options: { onChatSuccess, onChatError }
    });
  }, [meetingId, messagesActions]);

  useEffect(() => {
    chatRoom.chatParticipantInfo = {
      [ParticipantGroup.USER]: { id: localUserParticipantId },
      [ParticipantGroup.DISPLAY]: { id: localDisplayParticipantId }
    };
  }, [chatRoom, localDisplayParticipantId, localUserParticipantId]);

  useEffect(() => chatRoom.disconnect, [chatRoom]);

  const value = useMemo<ChatContext>(
    () => ({
      // State
      messages,
      chatError,
      connectionState,
      connectionError,
      // Actions
      connect: chatRoom.connect,
      disconnect: chatRoom.disconnect,
      sendMessage: chatRoom.sendMessage,
      deleteMessage: chatRoom.deleteMessage,
      disconnectUser: chatRoom.disconnectUser
    }),
    [
      messages,
      chatError,
      connectionError,
      connectionState,
      chatRoom.connect,
      chatRoom.deleteMessage,
      chatRoom.disconnect,
      chatRoom.disconnectUser,
      chatRoom.sendMessage
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export { ChatProvider, useChat };
