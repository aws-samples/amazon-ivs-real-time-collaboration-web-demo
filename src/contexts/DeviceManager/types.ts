import { MeetingParticipantInfo } from '@Shared/types';

interface DeviceManagerProviderProps {
  children: React.ReactNode;
}

interface UserMediaContext {
  devices: Devices;
  activeDevices: ActiveDevices;
  userMediaError?: UserMediaError;
  audioMuted: boolean;
  videoStopped: boolean;
  mediaStream?: MediaStream;
  previewStream?: MediaStream;
  toggleAudio: (options?: { muted?: boolean }) => void;
  toggleVideo: (options?: { stopped?: boolean }) => void;
  startUserMedia: () => Promise<MediaStream | undefined>;
  stopUserMedia: () => void;
  updateActiveDevice: (
    deviceKind: DeviceKind,
    device?: MediaDeviceInfo
  ) => void;
}

interface DisplayMediaContext {
  isScreenSharing: boolean;
  displayMediaError?: DisplayMediaError;
  startScreenShare: (freeSlot?: MeetingParticipantInfo) => Promise<void>;
  stopScreenShare: () => void;
}

interface DeviceManagerContext {
  userMedia: UserMediaContext;
  displayMedia: DisplayMediaContext;
  stopDevices: () => void;
}

interface EnhancedUserMediaStreamConstraints
  extends Exclude<MediaStreamConstraints, 'video'> {
  video?:
    | boolean
    | (MediaTrackConstraints & {
        resizeMode?: 'none' | 'crop-and-scale';
      });
}

interface EnhancedDisplayMediaStreamOptions
  extends Exclude<DisplayMediaStreamOptions, 'video'> {
  video?:
    | boolean
    | (MediaTrackConstraints & {
        resizeMode?: 'none' | 'crop-and-scale';
        cursor?: 'never' | 'always' | 'motion';
      });
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
}

enum DeviceKind {
  AUDIO = 'audio',
  VIDEO = 'video'
}

enum VideoMirrorMode {
  DISABLED,
  PREVIEW,
  PUBLISHED
}

interface Devices {
  [DeviceKind.AUDIO]?: MediaDeviceInfo[];
  [DeviceKind.VIDEO]?: MediaDeviceInfo[];
}

interface ActiveDevices {
  [DeviceKind.AUDIO]?: MediaDeviceInfo;
  [DeviceKind.VIDEO]?: MediaDeviceInfo;
}

interface DeviceSettings {
  deviceIds?: { audio?: string; video?: string };
  videoMirrorMode?: VideoMirrorMode;
}

type UserMediaError = 'permissionsDenied';

type DisplayMediaError = 'permissionsDenied' | 'freeSlotTimedOut';

type MediaToggles = Pick<UserMediaContext, 'toggleAudio' | 'toggleVideo'>;

export type {
  ActiveDevices,
  DeviceManagerContext,
  DeviceManagerProviderProps,
  Devices,
  DeviceSettings,
  DisplayMediaContext,
  DisplayMediaError,
  EnhancedDisplayMediaStreamOptions,
  EnhancedUserMediaStreamConstraints,
  MediaToggles,
  UserMediaContext,
  UserMediaError
};

export { DeviceKind, VideoMirrorMode };
