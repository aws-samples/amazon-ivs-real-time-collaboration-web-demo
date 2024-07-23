import { StageEndpoints } from '@aws-sdk/client-ivs-realtime';
import { MeetingParticipantAttributes } from '@Shared/types';

enum APIException {
  BAD_INPUT = 'BadInputException',
  MEETING_NOT_FOUND = 'MeetingNotFoundException'
}

interface MeetingRecord {
  id: string; // partition key
  alias: string;
  createdAt: string;
  updatedAt: string;
  chatRoomArn: string;
  stageArn: string;
  stageEndpoints: StageEndpoints;
  participantAttributes: Record<string, MeetingParticipantAttributes>;
  publishers?: Set<string>;
  subscribers?: Set<string>;
  activeSessionId?: string;
}

interface ActiveMeetingRecord {
  activeSessionId: string; // partition key
  id: string;
  stageArn: string;
  updatedAt: string; // used for SQS message deduplication
}

interface UserData {
  name: string;
  userId: string;
  picture: string;
}

interface StageUpdateEventDetail {
  event_name: 'Participant Published' | 'Participant Unpublished';
  participant_id: string;
  session_id: string;
  user_id: string;
}

interface JoinMeetingBody {
  meetingId?: string;
}

interface CreateChatTokenBody {
  meetingId: string;
}

export { APIException };

export type {
  ActiveMeetingRecord,
  CreateChatTokenBody,
  JoinMeetingBody,
  MeetingRecord,
  StageUpdateEventDetail,
  UserData
};
