import { noop } from '@Utils';

import {
  DeviceKind,
  Devices,
  EnhancedDisplayMediaStreamOptions,
  EnhancedUserMediaStreamConstraints
} from '../types';

const { mediaDevices } = navigator;

function checkMediaDevicesSupport() {
  if (!mediaDevices) {
    throw new Error(
      'Media device permissions can only be requested in a secure context (i.e. HTTPS).'
    );
  }
}

function stopMediaStream(mediaStream?: MediaStream) {
  const tracks = mediaStream?.getTracks() || [];
  tracks.forEach((track) => track.stop());
}

async function requestUserMediaPermissions({
  onGranted = noop,
  onDenied = noop,
  deviceIds = {}
}: {
  onGranted?: (mediaStream?: MediaStream) => Promise<void> | void;
  onDenied?: (error: Error) => void;
  deviceIds?: { audio?: string; video?: string };
}) {
  let mediaStream: MediaStream | undefined;
  let isGranted = false;
  let error: Error | undefined;

  try {
    mediaStream = await mediaDevices.getUserMedia({
      video: {
        deviceId: { ideal: deviceIds.video || 'default' }
      },
      audio: {
        deviceId: { ideal: deviceIds.audio || 'default' }
      }
    });

    isGranted = true;
  } catch (e) {
    console.error(e);
    error = new Error((e as Error).name); // NotAllowedError + NotFoundError
  }

  if (isGranted) {
    /**
     * onGranted is used to enumerate the available media devices upon obtaining permissions
     * to use the respective media inputs. The media device info labels retrieved from
     * navigator.mediaDevices.enumerateDevices() are only available during active MediaStream
     * use, or when persistent permissions have been granted.
     *
     * On Firefox in particular, the media info labels are set to an empty string when there
     * is no active MediaStream, even if the application had previously authorized temporary
     * access to the media devices by calling navigator.mediaDevices.getUserMedia().
     *
     * Therefore, onGranted must be called prior to stopping the media tracks to ensure that
     * we can reliably access the media device info labels across all browsers.
     */
    await onGranted(mediaStream);
    stopMediaStream(mediaStream);
  } else {
    onDenied(error as Error);
  }
}

async function enumerateDevices(): Promise<Devices> {
  try {
    checkMediaDevicesSupport();

    const devices = await mediaDevices.enumerateDevices();

    const videoInputDevices = devices.filter(
      ({ deviceId, kind }) => deviceId && kind === 'videoinput'
    );
    const audioInputDevices = devices.filter(
      ({ deviceId, kind }) => deviceId && kind === 'audioinput'
    );

    return { video: videoInputDevices, audio: audioInputDevices };
  } catch (error) {
    console.error(error);

    return { video: [], audio: [] };
  }
}

function getUserMedia({
  audioDeviceId,
  videoDeviceId
}: {
  audioDeviceId?: string;
  videoDeviceId?: string;
}) {
  if (!audioDeviceId && !videoDeviceId) {
    return;
  }

  checkMediaDevicesSupport();

  const constraints: EnhancedUserMediaStreamConstraints = {};

  if (videoDeviceId) {
    constraints.video = {
      deviceId: { exact: videoDeviceId }, // https://bugzilla.mozilla.org/show_bug.cgi?id=1443294#c7
      aspectRatio: { ideal: 16 / 9 },
      frameRate: { ideal: 30 },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: { ideal: 'user' },
      resizeMode: 'crop-and-scale'
    };
  }

  if (audioDeviceId) {
    constraints.audio = {
      deviceId: { exact: audioDeviceId }
    };
  }

  return mediaDevices.getUserMedia(constraints);
}

function getDisplayMedia() {
  checkMediaDevicesSupport();

  const options: EnhancedDisplayMediaStreamOptions = {
    video: {
      cursor: 'always',
      resizeMode: 'crop-and-scale',
      frameRate: { ideal: 30 },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: {
      // The following audio constraints disable all browser audio processing
      // to prevent potential audio quality and low volume issues when screen
      // sharing tab audio.
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false
    },
    // https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include',
    systemAudio: 'include',
    preferCurrentTab: false
  };

  return mediaDevices.getDisplayMedia(options);
}

function updateMediaStreamTracks(
  mediaStream: MediaStream,
  nextTracks: MediaStreamTrack[] = []
) {
  for (const nextTrack of nextTracks) {
    let currentTrack: MediaStreamTrack | undefined;

    if (nextTrack.kind === DeviceKind.AUDIO) {
      [currentTrack] = mediaStream.getAudioTracks();
    } else if (nextTrack.kind === DeviceKind.VIDEO) {
      [currentTrack] = mediaStream.getVideoTracks();
    }

    if (currentTrack?.id !== nextTrack.id) {
      if (currentTrack) {
        nextTrack.enabled = currentTrack.enabled;
        mediaStream.removeTrack(currentTrack);
        currentTrack.stop();
      }

      mediaStream.addTrack(nextTrack);
    }
  }
}

function createMirroredMediaStream(mediaStream: MediaStream) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const [videoTrack] = mediaStream.getVideoTracks();
  const [audioTrack] = mediaStream.getAudioTracks();

  if (!videoTrack) {
    return mediaStream;
  }

  const mirroredMediaStream = canvas.captureStream(30);
  const [mirroredVideoTrack] = mirroredMediaStream.getVideoTracks();
  mirroredMediaStream.addTrack(audioTrack);

  function drawOnCanvas(
    frame: HTMLVideoElement,
    width: number,
    height: number
  ) {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(-1, 0, 0, 1, width, 0);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(frame, 0, 0);
  }

  if ('MediaStreamTrackProcessor' in window) {
    const processor = new (window as any).MediaStreamTrackProcessor(videoTrack); // eslint-disable-line @typescript-eslint/no-explicit-any
    const reader = processor.readable.getReader();

    (async function readChunk() {
      const { done, value } = await reader.read();

      if (done || mirroredVideoTrack.readyState === 'ended') {
        videoTrack.stop(); // stop the source video track
        value.close();
        await reader.cancel();

        return;
      }

      drawOnCanvas(value, value.displayWidth, value.displayHeight);
      value.close();
      readChunk();
    })();
  } else {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.muted = true;

    const scheduler = video.requestVideoFrameCallback
      ? (callback: VideoFrameRequestCallback) =>
          video.requestVideoFrameCallback(callback)
      : requestAnimationFrame;

    (function draw() {
      if (mirroredVideoTrack.readyState === 'ended') {
        videoTrack.stop(); // stop the source video track
        video.srcObject = null;

        return;
      }

      drawOnCanvas(video, video.videoWidth, video.videoHeight);
      scheduler(draw);
    })();
  }

  return mirroredMediaStream;
}

export {
  createMirroredMediaStream,
  enumerateDevices,
  getDisplayMedia,
  getUserMedia,
  requestUserMediaPermissions,
  stopMediaStream,
  updateMediaStreamTracks
};
