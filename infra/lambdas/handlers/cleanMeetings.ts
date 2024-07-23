import { chatSdk, ddbSdk, realTimeSdk } from '@Lambda/sdk';
import { MeetingRecord } from '@Lambda/types';
import { getElapsedTimeInSeconds } from '@Lambda/utils';

async function handler() {
  try {
    const [meetingRecords, stages] = await Promise.all([
      ddbSdk.getMeetingRecords(['id', 'stageArn', 'chatRoomArn', 'updatedAt']),
      realTimeSdk.listStages()
    ]);

    console.info('Data to process', JSON.stringify({ meetingRecords, stages }));

    const stageSummaryMap = new Map(
      stages.map(({ arn, ...restData }) => [arn, restData])
    );

    const results = await Promise.all(
      meetingRecords.map(async (meetingRecord) => {
        const { id, stageArn, chatRoomArn, updatedAt } = meetingRecord;
        const stageSummary = stageSummaryMap.get(stageArn);
        const isActive = !!stageSummary?.activeSessionId;
        const isStale = getElapsedTimeInSeconds(updatedAt) > 24 * 3600;
        const shouldRetain = stageSummary?.tags?.retain === 'Y';

        if (!isActive && isStale && !shouldRetain) {
          try {
            await Promise.all([
              chatSdk.deleteChatRoom(chatRoomArn),
              realTimeSdk.deleteStage(stageArn),
              ddbSdk.deleteMeetingRecord(id)
            ]);

            return meetingRecord;
          } catch (error) {
            console.error(error);
            // Swallow the error to continue processing remaining items
          }
        }
      })
    );

    const deletedRecords = results.filter<MeetingRecord>(
      (record): record is MeetingRecord => record !== undefined
    );
    console.info('Deleted meeting records', deletedRecords);
  } catch (error) {
    console.error(error);
  }
}

export { handler };
