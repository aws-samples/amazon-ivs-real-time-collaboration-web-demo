import {
  AttributeValue,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ReturnValue,
  ScanCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { Participant, ParticipantState } from '@aws-sdk/client-ivs-realtime';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { convertToAttr, marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ActiveMeetingRecord, MeetingRecord } from '@Lambda/types';
import { cleanMeetingAlias } from '@Lambda/utils';
import { WithRequired } from '@Shared/types';

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient(), {
  marshallOptions: {
    convertClassInstanceToMap: false, // Whether to convert typeof object to map attribute
    convertEmptyValues: false, // Whether to automatically convert empty strings, blobs, and sets to `null`
    removeUndefinedValues: true // Whether to remove undefined values while marshalling
  },
  unmarshallOptions: {
    wrapNumbers: false // Whether to return numbers as a string instead of converting them to native JavaScript numbers
  }
});

async function createMeetingRecord(
  meetingAttributes: Pick<
    MeetingRecord,
    'id' | 'alias' | 'chatRoomArn' | 'stageArn' | 'stageEndpoints'
  >
) {
  const now = new Date().toISOString();
  const meetingRecord: MeetingRecord = {
    ...meetingAttributes,
    createdAt: now,
    updatedAt: now,
    participantAttributes: {}
  };

  await ddbDocClient.send(
    new PutItemCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      Item: marshall(meetingRecord)
    })
  );

  return meetingRecord;
}

async function deleteMeetingRecord(id: string) {
  await ddbDocClient.send(
    new DeleteItemCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      Key: { id: convertToAttr(id) }
    })
  );
}

async function getActiveMeetingRecords() {
  const { Items = [] } = await ddbDocClient.send(
    new ScanCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      IndexName: process.env.ACTIVE_MEETINGS_INDEX_NAME
    })
  );

  return Items.map((item) => unmarshall(item)) as ActiveMeetingRecord[];
}

async function getMeetingRecord(meetingId: string) {
  // Try to get the item by querying the Alias GSI and treating meetingId as the `alias` key
  const cleanedMeetingAlias = cleanMeetingAlias(meetingId);
  const { Items: AliasItems } = await ddbDocClient.send(
    new QueryCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      IndexName: process.env.ALIAS_INDEX_NAME,
      Limit: 1,
      KeyConditionExpression: '#alias = :meetingAlias',
      ExpressionAttributeNames: { '#alias': 'alias' },
      ExpressionAttributeValues: {
        ':meetingAlias': convertToAttr(cleanedMeetingAlias)
      }
    })
  );

  if (AliasItems && AliasItems.length > 0) {
    return unmarshall(AliasItems[0]) as MeetingRecord;
  }

  // Try to get the item by querying the parent Meetings Table and treating the meetingId as the `id` key
  const { Item } = await ddbDocClient.send(
    new GetItemCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      Key: { id: convertToAttr(meetingId) }
    })
  );

  if (Item) {
    return unmarshall(Item) as MeetingRecord;
  }
}

async function getMeetingRecords<
  Attributes extends keyof Partial<MeetingRecord>
>(attributesToGet: Attributes[] = [], filters: Partial<MeetingRecord> = {}) {
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, AttributeValue> = {};

  const filterExpression = Object.entries(filters)
    .map(([filterKey, filterValue]) => {
      expressionAttributeNames[`#${filterKey}`] = filterKey;
      expressionAttributeValues[`:${filterValue}`] = convertToAttr(filterValue);

      return `#${filterKey} = :${filterValue}`;
    })
    .join(' AND ');

  const projectionExpression = attributesToGet
    .map((attr) => {
      expressionAttributeNames[`#${attr}`] = attr;

      return `#${attr}`;
    })
    .join(',');

  const { Items = [] } = await ddbDocClient.send(
    new ScanCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      FilterExpression: filterExpression.length ? filterExpression : undefined,
      ProjectionExpression: projectionExpression.length
        ? projectionExpression
        : undefined,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length
        ? expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length
        ? expressionAttributeValues
        : undefined
    })
  );

  return Items.map(
    (item) => unmarshall(item) as Pick<Required<MeetingRecord>, Attributes>
  );
}

async function updateMeetingParticipant({
  id,
  participant,
  isPublishing
}: {
  id: string;
  participant: WithRequired<Participant, 'participantId'>;
  isPublishing?: boolean;
}) {
  const { participantId, state, attributes } = participant;
  const expressionAttributeNames: Record<string, string> = { '#id': 'id' };
  const expressionAttributeValues: Record<string, AttributeValue> = {};
  const setActions: string[] = [];
  const addActions: string[] = [];
  const delActions: string[] = [];

  if (attributes) {
    expressionAttributeNames['#participantAttributes'] =
      'participantAttributes';
    expressionAttributeNames[`#${participantId}`] = participantId;
    expressionAttributeValues[':attributes'] = convertToAttr(attributes);
    const action = `#participantAttributes.#${participantId} = :attributes`;

    setActions.push(action);
  }

  if (isPublishing !== undefined) {
    expressionAttributeNames['#publishers'] = 'publishers';
    expressionAttributeValues[':participantId'] = convertToAttr(
      new Set([participantId])
    );
    const action = '#publishers :participantId';

    if (isPublishing) {
      addActions.push(action);
    } else {
      delActions.push(action);
    }
  }

  if (state !== undefined) {
    expressionAttributeNames['#subscribers'] = 'subscribers';
    expressionAttributeValues[':participantId'] = convertToAttr(
      new Set([participantId])
    );
    const isConnected = state === ParticipantState.CONNECTED;
    const action = '#subscribers :participantId';

    if (isConnected) {
      addActions.push(action);
    } else {
      delActions.push(action);
    }
  }

  const now = new Date().toISOString();
  expressionAttributeValues[':updatedAt'] = convertToAttr(now);
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  setActions.push('#updatedAt = :updatedAt');

  const setClause = setActions.length ? `SET ${setActions.join(',')}` : '';
  const addClause = addActions.length ? `ADD ${addActions.join(',')}` : '';
  const delClause = delActions.length ? `DELETE ${delActions.join(',')}` : '';

  const updateExpression = [setClause, addClause, delClause].join(' ').trim();
  const conditionExpression = 'attribute_exists(#id)';

  const { Attributes = {} } = await ddbDocClient.send(
    new UpdateItemCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      Key: { id: convertToAttr(id) },
      UpdateExpression: updateExpression,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW
    })
  );

  return unmarshall(Attributes) as MeetingRecord;
}

async function updateMeetingRecord({
  id,
  attrsToSet = {},
  attrsToRemove = [],
  onlyUpdateIfActive = false
}: {
  id: string;
  attrsToSet?: Partial<Omit<MeetingRecord, 'id'>>;
  attrsToRemove?: (keyof Partial<Omit<MeetingRecord, 'id'>>)[];
  onlyUpdateIfActive?: boolean;
}) {
  const expressionAttributeValues: Record<string, AttributeValue> = {};
  const expressionAttributeNames: Record<string, string> = { '#id': 'id' };

  const setActions = Object.entries(attrsToSet).map(([key, value]) => {
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = convertToAttr(value);

    return `#${key} = :${key}`;
  });

  const remActions = attrsToRemove.map((key) => {
    expressionAttributeNames[`#${key}`] = key;

    return `#${key}`;
  });

  const now = new Date().toISOString();
  expressionAttributeValues[':updatedAt'] = convertToAttr(now);
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  setActions.push('#updatedAt = :updatedAt');

  const setClause = setActions.length ? `SET ${setActions.join(',')}` : '';
  const remClause = remActions.length ? `REMOVE ${remActions.join(',')}` : '';

  const updateExpression = [setClause, remClause].join(' ').trim();

  let conditionExpression = 'attribute_exists(#id)';
  if (onlyUpdateIfActive) {
    conditionExpression += ' and attribute_exists(#activeSessionId)';
    expressionAttributeNames['#activeSessionId'] = 'activeSessionId';
  }

  await ddbDocClient.send(
    new UpdateItemCommand({
      TableName: process.env.MEETINGS_TABLE_NAME,
      Key: { id: convertToAttr(id) },
      UpdateExpression: updateExpression,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW
    })
  );
}

export {
  createMeetingRecord,
  deleteMeetingRecord,
  getActiveMeetingRecords,
  getMeetingRecord,
  getMeetingRecords,
  updateMeetingParticipant,
  updateMeetingRecord
};
