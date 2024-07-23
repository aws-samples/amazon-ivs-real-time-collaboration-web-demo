import { Toast } from '@Components';
import { useBroadcast } from '@Contexts/Broadcast';
import { useChat } from '@Contexts/Chat';
import { useDeviceManager } from '@Contexts/DeviceManager';
import { useStageManager } from '@Contexts/StageManager';
import { StageError, StageErrorCode } from 'amazon-ivs-web-broadcast';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { ToastProps } from 'src/components/Toast';

import { MeetingPage } from '../../types';
import useMeetingToastError from './useMeetingToastError';

const toastedStageErrorCodes = [StageErrorCode.STAGE_AT_CAPACITY];

function generateStageError(stageError: StageError | null) {
  if (stageError) {
    const { category, code } = stageError;

    return toastedStageErrorCodes.includes(code)
      ? `${category}/${StageErrorCode[code]}`
      : `${category}`;
  }
}

interface MeetingToastProps {
  meetingPage: MeetingPage;
  toastProps: ToastProps;
}

function MeetingToast({ meetingPage, toastProps }: MeetingToastProps) {
  const { user: userStage, display: displayStage } = useStageManager();
  const { userMedia, displayMedia } = useDeviceManager();
  const { broadcastError } = useBroadcast();
  const { chatError } = useChat();

  // User Media Errors
  useMeetingToastError({
    key: 'userMedia',
    error: userMedia.userMediaError,
    duration: Infinity
  });

  // Display Media Errors
  useMeetingToastError({
    key: 'displayMedia',
    error: displayMedia.displayMediaError,
    duration: Infinity
  });

  // User Stage Errors
  useMeetingToastError({
    key: 'stage',
    error: generateStageError(userStage.publishError ?? userStage.connectError),
    duration: Infinity
  });

  // Display Stage Errors
  useMeetingToastError({
    key: 'stage',
    error: generateStageError(
      displayStage.publishError ?? displayStage.connectError
    ),
    duration: Infinity
  });

  // Chat Errors
  useMeetingToastError({
    key: 'chat',
    error: chatError?.errorCode.toString()
  });

  // Broadcast Errors
  useMeetingToastError({
    key: 'broadcast',
    error: broadcastError?.name
  });

  /**
   * Dismiss toasts when the meeting page changes.
   *
   * Meeting preview page toasts are retained as they
   * may apply to the meeting room page as well
   * (e.g. initial publication errors)
   */
  useEffect(
    () =>
      function dismissToasts() {
        if (meetingPage !== 'preview') {
          toast.dismiss();
        }
      },
    [meetingPage]
  );

  return <Toast {...toastProps} />;
}

export default MeetingToast;
