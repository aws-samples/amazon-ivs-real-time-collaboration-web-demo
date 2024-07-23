import {
  SendMessageBatchCommand,
  SendMessageBatchCommandOutput,
  SendMessageBatchRequestEntry,
  SQSClient
} from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient();

async function batchSendMessages(
  entries: SendMessageBatchRequestEntry[],
  queueUrl: string,
  batchSize = 10
) {
  const batchRequests: Promise<SendMessageBatchCommandOutput>[] = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchRequest = sqsClient.send(
      new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: batch })
    );

    batchRequests.push(batchRequest);
  }

  await Promise.all(batchRequests);
}

export { batchSendMessages };
