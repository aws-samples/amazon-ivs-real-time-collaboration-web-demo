import { meetingsApi } from '@Api';
import {
  GetMeetingResponse,
  JoinResponse,
  MeetingParticipantAttributes,
  ParticipantGroup
} from '@Shared/types';
import { utcDateTimeFormatter } from '@Utils';
import { jwtDecode } from 'jwt-decode';
import { useMemo } from 'react';
import { useAsyncValue } from 'react-router-dom';
import useSWR from 'swr';

interface MeetingInfo extends Partial<GetMeetingResponse> {
  summary?: MeetingSummary;
}

interface MeetingSummary {
  meetingId: string;
  stageArn: string;
  userParticipantId: string;
  displayParticipantId: string;
  userData: { userId: string; name: string };
  createdAt?: string;
}

interface TokenData {
  user_id: string;
  attributes: MeetingParticipantAttributes;
}

function useMeeting() {
  const joinData = useAsyncValue() as JoinResponse | undefined;
  const { data: meetingData, mutate: mutateMeeting } = useSWR(
    joinData?.meetingId || null,
    meetingsApi.getMeeting,
    { refreshInterval: 1000 }
  );

  const summary = useMemo<MeetingSummary | undefined>(() => {
    if (!joinData) {
      return undefined;
    }

    const {
      [ParticipantGroup.USER]: userStageConfig,
      [ParticipantGroup.DISPLAY]: displayStageConfig
    } = joinData.stageConfigs;
    const tokenData = jwtDecode<TokenData>(userStageConfig.token);
    const createdAt =
      meetingData?.createdAt &&
      utcDateTimeFormatter.format(new Date(meetingData.createdAt));

    return {
      userData: {
        userId: tokenData.user_id,
        name: tokenData.attributes.name
      },
      stageArn: joinData.stageArn,
      meetingId: joinData.meetingId,
      userParticipantId: userStageConfig.participantId,
      displayParticipantId: displayStageConfig.participantId,
      ...(createdAt && { createdAt })
    };
  }, [joinData, meetingData?.createdAt]);

  const meeting = useMemo<MeetingInfo>(
    () => ({ ...meetingData, summary }),
    [meetingData, summary]
  );

  return [meeting, mutateMeeting] as const;
}

export type { MeetingSummary };

export default useMeeting;
