import { GetMeetingResponse, JoinResponse } from '@Shared/types';
import { ChatToken } from 'amazon-ivs-chat-messaging';
import axios from 'axios';

async function joinMeeting(meetingId?: string): Promise<JoinResponse> {
  const response = await axios.post('/meeting/join', { meetingId });

  return response.data;
}

async function getMeeting(meetingId: string): Promise<GetMeetingResponse> {
  const response = await axios.get(`/meetings/${meetingId}`);

  return response.data;
}

async function createChatToken(meetingId: string): Promise<ChatToken> {
  const response = await axios.post('/chat/token/create', { meetingId });

  return response.data;
}

export { createChatToken, getMeeting, joinMeeting };
