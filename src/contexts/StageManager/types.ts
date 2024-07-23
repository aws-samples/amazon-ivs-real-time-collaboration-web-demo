import { MeetingParticipantInfo, ParticipantGroup } from '@Shared/types';
import {
  SimulcastConfiguration,
  StageConnectionState,
  StageError,
  StageParticipantPublishState,
  StreamType,
  SubscribeType
} from 'amazon-ivs-web-broadcast';

import type { Stage } from './StageFactory';

interface StageManagerProviderProps {
  children: React.ReactNode;
}

type StageManagerContext = { [Group in ParticipantGroup]: StageContext };

interface StageContext {
  connectState: StageConnectionState;
  publishState: StageParticipantPublishState;
  connectError: StageError | null;
  publishError: StageError | null;
  republishing: boolean;
  subscribeOnly: boolean;
  on: Stage['on'];
  off: Stage['off'];
  emit: Stage['emit'];
  join: Stage['join'];
  leave: Stage['leave'];
  publish: StrategyMutators['publish'];
  unpublish: StrategyMutators['unpublish'];
  setSimulcast: StrategyMutators['setSimulcast'];
  updateStreamsToPublish: StrategyMutators['updateStreamsToPublish'];
  getParticipants: (filters?: ParticipantsFilters) => MeetingParticipantInfo[];
  toggleLocalStageStreamMutedState: (
    streamType: StreamType,
    muted?: boolean
  ) => boolean | undefined;
}

interface StrategyMutators {
  publish: (mediaStreamToPublish?: MediaStream) => void;
  unpublish: () => void;
  republish: () => Promise<void>;
  resubscribe: () => void;
  updateStreamsToPublish: (mediaStreamToPublish: MediaStream) => void;
  setSubscribeType: (subscribeType: SubscribeType) => void;
  setSimulcast: (config: SimulcastConfiguration) => Promise<void>;
}

interface StageOptions {
  audioOnly?: boolean;
  simulcast?: SimulcastConfiguration;
}

enum CustomStageEvents {
  STAGE_PARTICIPANT_SHOULD_UNPUBLISH = 'stageParticipantShouldUnpublish',
  STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED = 'stageParticipantRepublishStateChanged'
}

type CustomStageEventMap = {
  [CustomStageEvents.STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED]: boolean;
  [CustomStageEvents.STAGE_PARTICIPANT_SHOULD_UNPUBLISH]: void;
};

type ParticipantsFilters = Partial<
  Pick<MeetingParticipantInfo, 'isLocal' | 'isPublishing'> & {
    canSubscribeTo?: boolean;
  }
>;

export type {
  CustomStageEventMap,
  ParticipantsFilters,
  StageContext,
  StageManagerContext,
  StageManagerProviderProps,
  StageOptions,
  StrategyMutators
};

export { CustomStageEvents };
