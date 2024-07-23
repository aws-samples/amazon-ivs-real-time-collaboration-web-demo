import { SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { ddbSdk, sqsSdk } from '@Lambda/sdk';

async function handler() {
  const activeMeetings = await ddbSdk.getActiveMeetingRecords();
  const batchEntries = activeMeetings.map<SendMessageBatchRequestEntry>(
    (activeMeeting) => ({
      Id: activeMeeting.id,
      MessageGroupId: 'ActiveMeetings',
      MessageBody: JSON.stringify(activeMeeting)
    })
  );

  await sqsSdk.batchSendMessages(
    batchEntries,
    process.env.ACTIVE_MEETINGS_QUEUE_URL as string
  );
}

export { handler };
