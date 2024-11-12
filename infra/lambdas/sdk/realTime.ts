import {
  CreateStageCommand,
  DeletePublicKeyCommand,
  DeleteStageCommand,
  GetParticipantCommand,
  ImportPublicKeyCommand,
  IVSRealTimeClient,
  ListParticipantsCommand,
  ListStagesCommand,
  Participant,
  ParticipantState,
  PublicKey,
  ResourceNotFoundException,
  Stage,
  StageEndpoints,
  StageSummary
} from '@aws-sdk/client-ivs-realtime';
import {
  PARTICIPANT_TOKEN_DURATION_IN_MINUTES,
  RESOURCE_TAGS
} from '@Lambda/constants';
import { getSecretValue } from '@Lambda/sdk/secretsManager';
import { getParameter } from '@Lambda/sdk/ssm';
import { UserData } from '@Lambda/types';
import { parseArn, retryWithBackoff } from '@Lambda/utils';
import { MeetingParticipantAttributes, ParticipantGroup } from '@Shared/types';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const ivsRealTimeClient = new IVSRealTimeClient();

const generateParticipantId = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', // alphanumeric
  12
);

async function createStage() {
  const { stage } = await retryWithBackoff(() =>
    ivsRealTimeClient.send(
      new CreateStageCommand({ tags: { ...RESOURCE_TAGS, retain: 'N' } })
    )
  );

  return stage as Stage;
}

async function createToken({
  userData,
  stageArn,
  stageEndpoints,
  participantGroup
}: {
  userData: UserData;
  stageArn: string;
  stageEndpoints: StageEndpoints;
  participantGroup: ParticipantGroup;
}) {
  const attributes: MeetingParticipantAttributes = {
    participantGroup,
    name: userData.name,
    picture: userData.picture
  };
  const capabilities = { allow_publish: true, allow_subscribe: true };
  const participantId = generateParticipantId();
  const stageId = parseArn(stageArn).resourceId;
  const payload = {
    attributes,
    capabilities,
    version: '1.0',
    topic: stageId,
    resource: stageArn,
    jti: participantId,
    user_id: userData.userId,
    whip_url: stageEndpoints.whip,
    events_url: stageEndpoints.events
  };

  const [privateKey, keyid] = await Promise.all([
    getSecretValue(process.env.PRIVATE_KEY_SECRET_ARN as string),
    getPublicKeyArn()
  ]);
  const expiresIn = `${PARTICIPANT_TOKEN_DURATION_IN_MINUTES} minutes`;
  const signOptions: jwt.SignOptions = { algorithm: 'ES384', keyid, expiresIn };
  const participantToken = jwt.sign(payload, privateKey, signOptions);

  return { token: participantToken, participantId, attributes };
}

async function deletePublicKey(arn: string) {
  try {
    await retryWithBackoff(() =>
      ivsRealTimeClient.send(new DeletePublicKeyCommand({ arn }))
    );
  } catch (error) {
    if (!(error instanceof ResourceNotFoundException)) {
      throw error;
    }
  }
}

async function deleteStage(stageArn: string) {
  await retryWithBackoff(() =>
    ivsRealTimeClient.send(new DeleteStageCommand({ arn: stageArn }))
  );
}

async function getParticipant(
  stageArn: string,
  participantId: string,
  sessionId: string
) {
  const { participant } = await retryWithBackoff(() =>
    ivsRealTimeClient.send(
      new GetParticipantCommand({ stageArn, participantId, sessionId })
    )
  );

  return participant as Participant;
}

async function getPublicKeyArn() {
  const publicKeyArnParamName = process.env.PUBLIC_KEY_ARN_PARAM_NAME as string;

  try {
    const parameterValue = await getParameter(publicKeyArnParamName);
    const { arn } = JSON.parse(parameterValue) as Pick<PublicKey, 'arn'>;

    return arn;
  } catch (error) {
    throw new Error(
      `Failed to retrieve the Public Key ARN parameter "${publicKeyArnParamName}".`,
      { cause: error }
    );
  }
}

async function importPublicKey(keyPrefix: string, publicKeyMaterial: string) {
  const createdAt = Date.now();
  const { publicKey } = await ivsRealTimeClient.send(
    new ImportPublicKeyCommand({
      publicKeyMaterial,
      name: `${keyPrefix}-${createdAt}`,
      tags: { createdAt: new Date(createdAt).toISOString() }
    })
  );

  return (publicKey as PublicKey).arn as string;
}

async function listParticipants(
  stageArn: string,
  sessionId: string,
  state?: ParticipantState
) {
  const totalParticipants: Participant[] = [];

  async function listStageParticipants(token?: string, depth = 0) {
    const { participants = [], nextToken } = await retryWithBackoff(() =>
      ivsRealTimeClient.send(
        new ListParticipantsCommand({
          stageArn,
          sessionId,
          maxResults: 100,
          nextToken: token,
          ...(state && { filterByState: state })
        })
      )
    );
    totalParticipants.push(...participants);

    if (nextToken) {
      // Exponential backoff (1s maximum delay)
      await new Promise((resolve) => {
        setTimeout(resolve, Math.min(2 ** depth * 10, 1000));
      });

      await listStageParticipants(nextToken, depth + 1);
    }
  }

  await listStageParticipants();

  return totalParticipants;
}

async function listStages() {
  const totalStages: StageSummary[] = [];

  async function _listStages(token?: string, depth = 0) {
    const { stages = [], nextToken } = await retryWithBackoff(() =>
      ivsRealTimeClient.send(
        new ListStagesCommand({ maxResults: 100, nextToken: token })
      )
    );

    totalStages.push(...stages);

    if (nextToken) {
      // Exponential backoff (1s maximum delay)
      await new Promise((resolve) => {
        setTimeout(resolve, Math.min(2 ** depth * 100, 1000));
      });

      await _listStages(nextToken, depth + 1);
    }
  }

  await _listStages();

  const stackStages = totalStages.filter(
    ({ tags }) => !!tags?.stack && tags.stack === RESOURCE_TAGS.stack
  );

  return stackStages;
}

export {
  createStage,
  createToken,
  deletePublicKey,
  deleteStage,
  getParticipant,
  getPublicKeyArn,
  importPublicKey,
  listParticipants,
  listStages
};
