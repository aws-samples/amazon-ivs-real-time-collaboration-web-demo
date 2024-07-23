import { StageParticipantInfo } from 'amazon-ivs-web-broadcast';

type Maybe<T> = T | undefined;

type ValueOf<T> = T[keyof T];

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

enum StackType {
  BACKEND = 'backend',
  WEBSITE = 'website'
}

enum AppEnv {
  DEV = 'development',
  PROD = 'production',
  STAGING = 'staging',
  TEST = 'test'
}

enum ParticipantGroup {
  USER = 'user',
  DISPLAY = 'display'
}

enum CognitoException {
  USERNAME_EXISTS = 'UsernameExistsException',
  EMAIL_EXISTS = 'EmailExistsException',
  EMAIL_DOMAIN_FORBIDDEN = 'EmailDomainForbiddenException'
}

interface MeetingParticipantAttributes {
  [attr: string]: string;
  name: string;
  picture: string;
  participantGroup: ParticipantGroup;
}

/**
 * Stage API Participant Types (backend)
 */

type MeetingParticipants = Record<
  ParticipantGroup,
  Record<string, MeetingParticipant>
>;

interface MeetingParticipant {
  id: string;
  isPublishing: boolean;
  attributes: MeetingParticipantAttributes;
}

/**
 * Backend API Responses
 */
interface StageClientConfig {
  readonly token: string;
  readonly participantId: string;
  readonly participantGroup: ParticipantGroup;
}

interface JoinResponse {
  meetingId: string;
  stageArn: string;
  stageConfigs: Record<ParticipantGroup, StageClientConfig>;
}

interface GetMeetingResponse {
  id: string;
  alias: string;
  stageArn: string;
  createdAt: string;
  isActive: boolean;
  participants: MeetingParticipants;
}

/**
 * Stage Client Participant Types (frontend)
 */
interface MeetingParticipantInfo
  extends MeetingParticipant,
    Partial<Omit<StageParticipantInfo, keyof MeetingParticipant>> {
  mediaStream?: MediaStream;
  streamMetadata?: StreamMetadata;
}

interface StreamMetadata {
  audioOnly: boolean;
}

export type {
  GetMeetingResponse,
  JoinResponse,
  Maybe,
  MeetingParticipant,
  MeetingParticipantAttributes,
  MeetingParticipantInfo,
  MeetingParticipants,
  StageClientConfig,
  StreamMetadata,
  ValueOf,
  WithRequired
};

export { AppEnv, CognitoException, ParticipantGroup, StackType };
