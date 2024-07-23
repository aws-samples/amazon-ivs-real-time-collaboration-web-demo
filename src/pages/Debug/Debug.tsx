import { meetingsApi } from '@Api';
import { Button, Toast } from '@Components';
import { getDebugMessage } from '@Content';
import { JoinResponse, ParticipantGroup } from '@Shared/types';
import { clsm } from '@Utils';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAsyncValue } from 'react-router-dom';

import DebugInput from './DebugInput';

interface TokenWhipInfo {
  jti: string;
  whip_url: string;
}

function createWhipUrl(participantToken: string) {
  const decodedParticipantToken = jwtDecode<TokenWhipInfo>(participantToken);

  return `${decodedParticipantToken.whip_url}/publish/${decodedParticipantToken.jti}`;
}

function Debug() {
  const initMeetingData = useAsyncValue() as JoinResponse;
  const [meetingData, setMeetingData] = useState<JoinResponse>(initMeetingData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { meetingId, stageArn, stageConfigs } = meetingData;

  const userParticipantToken = stageConfigs[ParticipantGroup.USER].token;
  const displayParticipantToken = stageConfigs[ParticipantGroup.DISPLAY].token;

  const userParticipantWhipUrl = useMemo(
    () => createWhipUrl(userParticipantToken),
    [userParticipantToken]
  );
  const displayParticipantWhipUrl = useMemo(
    () => createWhipUrl(displayParticipantToken),
    [displayParticipantToken]
  );

  const refreshTokens = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const result = await toast.promise(
        meetingsApi.joinMeeting(meetingId),
        {
          loading: getDebugMessage('refreshingTokens'),
          success: getDebugMessage('refreshedTokens'),
          error: getDebugMessage('failedToRefreshTokens')
        },
        { id: 'refreshTokens' }
      );
      setMeetingData(result);
    } catch (error) {
      console.error(error);
    }

    setIsRefreshing(false);
  }, [meetingId]);

  return (
    <main
      className={clsm([
        'flex',
        'flex-col',
        'justify-center',
        'items-center',
        'h-dvh'
      ])}
    >
      <Toast />
      <section className={clsm(['w-screen', 'overflow-y-auto'])}>
        <div
          className={clsm([
            'flex',
            'flex-col',
            'gap-8',
            'p-8',
            'pb-16',
            'sm:px-4',
            'w-full',
            'mx-auto',
            'max-w-3xl'
          ])}
        >
          <h1>{getDebugMessage('debug')}</h1>
          <h3 className={clsm(['font-mono', 'truncate'])}>{meetingId}</h3>
          <DebugInput
            name="userParticipantToken"
            value={userParticipantToken}
            label={getDebugMessage('userParticipantToken')}
            dir="rtl"
          />
          <DebugInput
            name="displayParticipantToken"
            value={displayParticipantToken}
            label={getDebugMessage('displayParticipantToken')}
            dir="rtl"
          />
          <DebugInput
            name="userParticipantWhipUrl"
            value={userParticipantWhipUrl}
            label={getDebugMessage('userParticipantWhipUrl')}
          />
          <DebugInput
            name="displayParticipantWhipUrl"
            value={displayParticipantWhipUrl}
            label={getDebugMessage('displayParticipantWhipUrl')}
          />
          <DebugInput
            name="stageArn"
            value={stageArn}
            label={getDebugMessage('stageArn')}
          />
          <Button
            isLoading={isRefreshing}
            disabled={isRefreshing}
            onClick={refreshTokens}
            className="disabled:cursor-auto"
          >
            {getDebugMessage('refreshTokens')}
          </Button>
        </div>
      </section>
    </main>
  );
}

export default Debug;
