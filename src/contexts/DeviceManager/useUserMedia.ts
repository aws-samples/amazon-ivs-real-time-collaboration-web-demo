import { useStageManager } from '@Contexts/StageManager';
import { useLocalStorage } from '@Hooks';
import {
  StageParticipantPublishState,
  StreamType
} from 'amazon-ivs-web-broadcast';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  createMirroredMediaStream,
  getUserMedia,
  stopMediaStream,
  updateMediaStreamTracks
} from './helpers';
import { UserMediaContext, VideoMirrorMode } from './types';
import useLocalDevices from './useLocalDevices';

const { PUBLISHED } = StageParticipantPublishState;

let mediaStream: MediaStream = new MediaStream();
let previewStream: MediaStream = new MediaStream();

/**
 * Creates and manages a single user media stream
 */
function useUserMedia(): UserMediaContext {
  const {
    user: {
      publishState,
      republishing,
      subscribeOnly,
      updateStreamsToPublish,
      toggleLocalStageStreamMutedState
    }
  } = useStageManager();
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoStopped, setVideoStopped] = useState(false);
  const [deviceSettings = {}, storeDeviceSettings] = useLocalStorage('devices');
  const publishStateDeferred = useDeferredValue(publishState);
  const unpublished = subscribeOnly && publishStateDeferred === PUBLISHED;
  const shouldPublishMirroredVideo =
    deviceSettings.videoMirrorMode === VideoMirrorMode.PUBLISHED;

  const toggleAudio = useCallback(
    ({ muted }: { muted?: boolean } = {}) => {
      // If available, the audio local stage stream should be the source of truth for the next muted state
      const isAudioLocalStageStreamMuted = toggleLocalStageStreamMutedState(
        StreamType.AUDIO,
        muted
      );

      const mediaStreamAudioTrack = mediaStream.getAudioTracks()[0];
      if (mediaStreamAudioTrack) {
        const nextAudioMuted =
          isAudioLocalStageStreamMuted ??
          muted ??
          mediaStreamAudioTrack.enabled;
        setAudioMuted(nextAudioMuted);

        /**
         * If the local participant is not yet publishing, then no audio LocalStageStream instances will be available.
         * As a result, since there is no link yet between the Stage and the local audio MediaStream track, attempting
         * to mute the track by calling the setMuted method on the LocalStageStream class will have no effect. Therefore,
         * we must ensure that the `enabled` property on the local audio MediaStream track reflects the correct muted state
         * before the local participant starts publishing. Once the local participant starts publishing, this state will be
         * picked up by the Stage strategy to instantiate the audio LocalStageStream instance with the expected muted state.
         */
        if (isAudioLocalStageStreamMuted === undefined) {
          mediaStreamAudioTrack.enabled = !nextAudioMuted;
        }
      }
    },
    [toggleLocalStageStreamMutedState]
  );

  const toggleVideo = useCallback(
    ({ stopped }: { stopped?: boolean } = {}) => {
      // If available, the video local stage stream should be the source of truth for the next muted state
      const isVideoLocalStageStreamMuted = toggleLocalStageStreamMutedState(
        StreamType.VIDEO,
        stopped
      );

      const mediaStreamVideoTrack = mediaStream.getVideoTracks()[0];
      if (mediaStreamVideoTrack) {
        const nextVideoStopped =
          isVideoLocalStageStreamMuted ??
          stopped ??
          mediaStreamVideoTrack.enabled;
        setVideoStopped(nextVideoStopped);

        /**
         * If the local participant is not yet publishing, then no video LocalStageStream instances will be available.
         * As a result, since there is no link yet between the Stage and the local video MediaStream track, attempting
         * to mute the track by calling the setMuted method on the LocalStageStream class will have no effect. Therefore,
         * we must ensure that the `enabled` property on the local video MediaStream track reflects the correct muted state
         * before the local participant starts publishing. Once the local participant starts publishing, this state will be
         * picked up by the Stage strategy to instantiate the video LocalStageStream instance with the expected muted state.
         */
        if (isVideoLocalStageStreamMuted === undefined) {
          mediaStreamVideoTrack.enabled = !nextVideoStopped;
        }
      }
    },
    [toggleLocalStageStreamMutedState]
  );

  const {
    devices,
    activeDevices,
    userMediaError,
    startLocalDevices,
    updateActiveDevice
  } = useLocalDevices({ toggleAudio, toggleVideo });

  const updateMediaStream = useCallback(
    async (deviceIds: { audioDeviceId?: string; videoDeviceId?: string }) => {
      let newMediaStream: MediaStream | undefined;

      try {
        newMediaStream = await getUserMedia(deviceIds);
      } catch (error) {
        console.error(error);

        return;
      }

      if (newMediaStream) {
        const previewTracks = newMediaStream.clone().getTracks();
        updateMediaStreamTracks(previewStream, previewTracks);

        if (shouldPublishMirroredVideo) {
          newMediaStream = createMirroredMediaStream(newMediaStream);
        }

        updateMediaStreamTracks(mediaStream, newMediaStream.getTracks());
        updateStreamsToPublish(newMediaStream);
      }

      return mediaStream;
    },
    [shouldPublishMirroredVideo, updateStreamsToPublish]
  );

  const startUserMedia = useCallback(async () => {
    const activeDeviceInfo = await startLocalDevices();

    return updateMediaStream({
      audioDeviceId: activeDeviceInfo.audio?.deviceId,
      videoDeviceId: activeDeviceInfo.video?.deviceId
    });
  }, [startLocalDevices, updateMediaStream]);

  const stopUserMedia = useCallback(() => {
    stopMediaStream(mediaStream);
    mediaStream = new MediaStream();

    stopMediaStream(previewStream);
    previewStream = new MediaStream();

    setAudioMuted(false);
    setVideoStopped(false);
  }, []);

  useEffect(() => {
    const audioDeviceId = activeDevices.audio?.deviceId;
    const videoDeviceId = activeDevices.video?.deviceId;

    storeDeviceSettings((prevStoredPreferences) => ({
      ...prevStoredPreferences,
      deviceIds: {
        audio: audioDeviceId ?? prevStoredPreferences?.deviceIds?.audio,
        video: videoDeviceId ?? prevStoredPreferences?.deviceIds?.video
      }
    }));

    // Only process changes made to existing mediaStream tracks
    if (mediaStream.getTracks().length) {
      updateMediaStream({ audioDeviceId, videoDeviceId });
    }
  }, [
    activeDevices.audio?.deviceId,
    activeDevices.video?.deviceId,
    storeDeviceSettings,
    updateMediaStream
  ]);

  useEffect(() => {
    if (unpublished && !republishing) {
      stopUserMedia();
    }
  }, [unpublished, republishing, stopUserMedia]);

  useEffect(() => stopUserMedia, [stopUserMedia]);

  return useMemo<UserMediaContext>(
    () => ({
      activeDevices,
      audioMuted,
      devices,
      startUserMedia,
      mediaStream,
      previewStream,
      stopUserMedia,
      toggleAudio,
      toggleVideo,
      updateActiveDevice,
      userMediaError,
      videoStopped
    }),
    [
      activeDevices,
      audioMuted,
      devices,
      startUserMedia,
      userMediaError,
      stopUserMedia,
      toggleAudio,
      toggleVideo,
      updateActiveDevice,
      videoStopped
    ]
  );
}

export default useUserMedia;
