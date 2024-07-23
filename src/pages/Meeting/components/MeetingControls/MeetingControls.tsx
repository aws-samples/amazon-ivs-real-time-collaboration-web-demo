import {
  IconBroadcastStart,
  IconBroadcastStop,
  IconCallEnd,
  IconCameraOff,
  IconCameraOn,
  IconMicOff,
  IconMicOn,
  IconScreenShareStart,
  IconScreenShareStop,
  IconSettings
} from '@Assets/icons';
import { ButtonGroup } from '@Components';
import { getControlsMessage } from '@Content';
import { useBroadcast } from '@Contexts/Broadcast';
import { useDeviceManager } from '@Contexts/DeviceManager';
import { StageFactory, useStageManager } from '@Contexts/StageManager';
import { clsm } from '@Utils';
import { useState } from 'react';

import { FreeSlotModal, GoLiveModal, SettingsModal } from './modals';

interface ControlsProps {
  isPreview?: boolean;
  leaveMeeting?: () => void;
}

type ModalType = null | 'settings' | 'goLive' | 'freeSlot';

function MeetingControls({ isPreview = false, leaveMeeting }: ControlsProps) {
  const {
    userMedia: {
      audioMuted,
      toggleAudio,
      toggleVideo,
      videoStopped,
      mediaStream: userMediaStream
    },
    displayMedia: { isScreenSharing, startScreenShare, stopScreenShare }
  } = useDeviceManager();
  const { user: userStage } = useStageManager();
  const { isBroadcasting, stopBroadcast } = useBroadcast();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const isCameraDisabled = !userMediaStream?.getVideoTracks().length;
  const isMicrophoneDisabled = !userMediaStream?.getAudioTracks().length;

  function closeModal() {
    setActiveModal(null);
  }

  function handleGoLive() {
    if (isBroadcasting) {
      stopBroadcast();
    } else {
      setActiveModal('goLive');
    }
  }

  function handleScreenShare() {
    if (isScreenSharing) {
      stopScreenShare();
    } else if (StageFactory.hasPublishCapacity) {
      startScreenShare();
    } else {
      setActiveModal('freeSlot');
    }
  }

  return (
    <>
      <ButtonGroup
        isIcon
        lightVariant="secondary"
        darkVariant="tertiary"
        buttons={[
          {
            name: 'goLiveModal',
            isHidden: isPreview,
            'aria-label': isBroadcasting
              ? getControlsMessage('stopStream')
              : getControlsMessage('goLive'),
            onClick: handleGoLive,
            lightVariant: isBroadcasting ? 'destructive' : 'secondary',
            darkVariant: isBroadcasting ? 'destructive' : 'tertiary',
            children: isBroadcasting ? (
              <IconBroadcastStop />
            ) : (
              <IconBroadcastStart />
            )
          },
          {
            name: 'microphone',
            isHidden: !isPreview && userStage.subscribeOnly,
            'aria-label': audioMuted
              ? getControlsMessage('turnOnMicrophone')
              : getControlsMessage('turnOffMicrophone'),
            onClick: () => toggleAudio(),
            disabled: isMicrophoneDisabled,
            children: audioMuted ? <IconMicOff /> : <IconMicOn />
          },
          {
            name: 'camera',
            isHidden: !isPreview && userStage.subscribeOnly,
            'aria-label': videoStopped
              ? getControlsMessage('turnOnCamera')
              : getControlsMessage('turnOffCamera'),
            onClick: () => toggleVideo(),
            disabled: isCameraDisabled,
            children: videoStopped ? <IconCameraOff /> : <IconCameraOn />
          },
          {
            name: 'screenShare',
            isHidden: isPreview || userStage.subscribeOnly,
            'aria-label': isScreenSharing
              ? getControlsMessage('stopScreenSharing')
              : getControlsMessage('startScreenSharing'),
            onClick: () => handleScreenShare(),
            children: isScreenSharing ? (
              <IconScreenShareStop />
            ) : (
              <IconScreenShareStart />
            )
          },
          {
            name: 'settings',
            isHidden: !isPreview && userStage.subscribeOnly,
            'aria-label': getControlsMessage('openSettings'),
            onClick: () => setActiveModal('settings'),
            children: <IconSettings />
          },
          {
            name: 'leaveMeeting',
            isHidden: isPreview,
            'aria-label': getControlsMessage('leaveMeeting'),
            onClick: leaveMeeting,
            children: <IconCallEnd />,
            lightVariant: isBroadcasting ? 'secondary' : 'destructive',
            darkVariant: isBroadcasting ? 'tertiary' : 'destructive',
            className: clsm([
              'min-w-[72px]',
              isBroadcasting && [
                'ring-2',
                'ring-inset',
                'ring-red-600',
                'hover:ring-red-700',
                'dark:hover:ring-red-500'
              ]
            ])
          }
        ]}
      />
      <SettingsModal isOpen={activeModal === 'settings'} onClose={closeModal} />
      <GoLiveModal isOpen={activeModal === 'goLive'} onClose={closeModal} />
      <FreeSlotModal isOpen={activeModal === 'freeSlot'} onClose={closeModal} />
    </>
  );
}

export default MeetingControls;
