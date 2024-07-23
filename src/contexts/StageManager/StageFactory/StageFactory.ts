import { STAGE_PUBLISHING_CAPACITY } from '@Constants';
import { StageClientConfig } from '@Shared/types';
import { StageEvents, StageParticipantInfo } from 'amazon-ivs-web-broadcast';

import Stage from './Stage';

class StageFactory {
  private static readonly stages = new Map<string, Stage>();

  private static readonly publishers = new Set<string>();

  static create(stageConfig: StageClientConfig) {
    let stage = StageFactory.stages.get(stageConfig.participantId);

    if (!stage) {
      stage = new Stage(stageConfig);

      stage.on(
        StageEvents.STAGE_PARTICIPANT_JOINED,
        StageFactory.updatePublishers
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_LEFT,
        StageFactory.removePublisher
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
        StageFactory.updatePublishers
      );

      StageFactory.stages.set(stageConfig.participantId, stage);

      // Attach the stages to the window for debugging purposes
      Object.assign(window, { stages: StageFactory.stages });
    }

    return stage;
  }

  static get hasPublishCapacity() {
    return StageFactory.publishers.size < STAGE_PUBLISHING_CAPACITY;
  }

  private static addPublisher(participant: StageParticipantInfo) {
    StageFactory.publishers.add(participant.id);
  }

  private static removePublisher(participant: StageParticipantInfo) {
    StageFactory.publishers.delete(participant.id);
  }

  private static updatePublishers(participant: StageParticipantInfo) {
    if (participant.isPublishing) {
      StageFactory.addPublisher(participant);
    } else {
      StageFactory.removePublisher(participant);
    }
  }

  private static destroyStage(stage: Stage) {
    stage.leave();
    stage.removeAllListeners();
    StageFactory.stages.delete(stage.localParticipantId);

    if (!StageFactory.stages.size) {
      StageFactory.publishers.clear();
      delete (window as any).stages; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  static destroyStages() {
    StageFactory.stages.forEach(StageFactory.destroyStage);
  }

  static leaveStages() {
    StageFactory.stages.forEach((stage) => stage.leave());
  }
}

export default StageFactory;
