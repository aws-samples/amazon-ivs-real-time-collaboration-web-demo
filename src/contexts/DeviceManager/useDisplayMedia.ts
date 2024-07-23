import { useStageManager } from '@Contexts/StageManager';
import { JoinResponse, MeetingParticipantInfo } from '@Shared/types';
import {
  StageEvents,
  StageParticipantInfo,
  StageParticipantPublishState
} from 'amazon-ivs-web-broadcast';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useAsyncValue } from 'react-router-dom';

import {
  dismissFreeSlot,
  freeSlot,
  getDisplayMedia,
  notifyFreeSlot,
  stopMediaStream
} from './helpers';
import { DisplayMediaContext, DisplayMediaError } from './types';

const { STAGE_PARTICIPANT_LEFT } = StageEvents;
const { PUBLISHED } = StageParticipantPublishState;

let mediaStream: MediaStream | undefined;
let isScreenShareDialogOpen = false;

/**
 * Creates and manages a single display media stream
 */
function useDisplayMedia(): DisplayMediaContext {
  const { meetingId } = useAsyncValue() as JoinResponse;
  const {
    display: {
      on,
      off,
      publish,
      publishState,
      publishError,
      republishing,
      subscribeOnly,
      unpublish: unpublishScreenShare
    }
  } = useStageManager();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [displayMediaError, setDisplayMediaError] =
    useState<DisplayMediaError>();
  const freeSlotAbortController = useRef<AbortController>();
  const publishStateDeferred = useDeferredValue(publishState);
  const unpublished = subscribeOnly && publishStateDeferred === PUBLISHED;

  const stopScreenShare = useCallback(() => {
    freeSlotAbortController.current?.abort();

    unpublishScreenShare();
    stopMediaStream(mediaStream);
    mediaStream = undefined;

    setIsScreenSharing(false);
  }, [unpublishScreenShare]);

  const publishScreenShare = useCallback(
    async (freeSlotParticipant?: MeetingParticipantInfo) => {
      if (!freeSlotParticipant) {
        publish(mediaStream);

        return;
      }

      // Publish the screen-share once the freeSlotParticipant has unpublished/left
      function onStageParticipantLeft(participant: StageParticipantInfo) {
        if (participant.id === freeSlotParticipant?.id) {
          publish(mediaStream);
          cleanup();
        }
      }

      function cleanup() {
        clearTimeout(freeSlotTimeout);
        off(STAGE_PARTICIPANT_LEFT, onStageParticipantLeft);
        freeSlotAbortController.current = undefined;
      }

      const freeSlotTimeout = setTimeout(() => {
        stopScreenShare();
        setDisplayMediaError('freeSlotTimedOut');
      }, 10_000);

      freeSlotAbortController.current = new AbortController();
      freeSlotAbortController.current.signal.addEventListener('abort', cleanup);

      on(STAGE_PARTICIPANT_LEFT, onStageParticipantLeft);
      await freeSlot(meetingId, freeSlotParticipant);
    },
    [meetingId, off, on, publish, stopScreenShare]
  );

  const startScreenShare = useCallback(
    async (freeSlotParticipant?: MeetingParticipantInfo) => {
      if (isScreenShareDialogOpen) return;

      stopScreenShare();
      setDisplayMediaError(undefined);

      let cancelled = false;
      try {
        if (freeSlotParticipant) {
          notifyFreeSlot(meetingId, freeSlotParticipant);
        }

        isScreenShareDialogOpen = true;
        mediaStream = await getDisplayMedia();
      } catch (error) {
        /**
         * In Chrome only, a "Permission denied" DOMException indicates that
         * the user cancelled the screen-share request from the window prompt
         * without explicitly denying permissions.
         */
        cancelled =
          error instanceof DOMException &&
          error.message === 'Permission denied';
      } finally {
        isScreenShareDialogOpen = false;
      }

      if (!mediaStream) {
        if (!cancelled) {
          setDisplayMediaError('permissionsDenied');
        }

        if (freeSlotParticipant) {
          dismissFreeSlot(meetingId, freeSlotParticipant);
        }

        return;
      }

      setIsScreenSharing(true);
      await publishScreenShare(freeSlotParticipant);
    },
    [meetingId, publishScreenShare, stopScreenShare]
  );

  useEffect(() => {
    const screenCaptureTrack = mediaStream?.getVideoTracks()[0];
    screenCaptureTrack?.addEventListener('ended', stopScreenShare);

    return () => {
      screenCaptureTrack?.removeEventListener('ended', stopScreenShare);
    };
  }, [isScreenSharing, stopScreenShare]);

  useEffect(() => {
    if (publishError || (unpublished && !republishing)) {
      stopScreenShare();
    }
  }, [unpublished, republishing, publishError, stopScreenShare]);

  useEffect(() => stopScreenShare, [stopScreenShare]);

  return useMemo<DisplayMediaContext>(
    () => ({
      isScreenSharing,
      startScreenShare,
      stopScreenShare,
      displayMediaError
    }),
    [isScreenSharing, startScreenShare, stopScreenShare, displayMediaError]
  );
}

export default useDisplayMedia;
