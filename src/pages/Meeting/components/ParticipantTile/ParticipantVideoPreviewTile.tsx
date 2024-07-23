import { useDeviceManager, VideoMirrorMode } from '@Contexts/DeviceManager';
import { useLocalStorage } from '@Hooks';
import { MeetingParticipantAttributes, StreamMetadata } from '@Shared/types';
import { clsm } from '@Utils';
import { deepEqual } from 'fast-equals';
import { memo } from 'react';

import { Video } from './media';
import TileContainer from './TileContainer';
import TileOverlays from './TileOverlays';

interface ParticipantVideoPreviewTileProps {
  attributes: MeetingParticipantAttributes;
  containerStyle?: React.CSSProperties;
  streamMetadata?: StreamMetadata;
}

function ParticipantVideoPreviewTile({
  attributes,
  containerStyle,
  streamMetadata = { audioOnly: false }
}: ParticipantVideoPreviewTileProps) {
  const [deviceSettings = {}] = useLocalStorage('devices');
  const { userMedia } = useDeviceManager();
  const { audioMuted, videoStopped, previewStream } = userMedia;
  const { videoMirrorMode = VideoMirrorMode.DISABLED } = deviceSettings;
  const videoHidden = videoStopped || streamMetadata.audioOnly;
  const videoMirrored = videoMirrorMode !== VideoMirrorMode.DISABLED;

  return (
    <TileContainer
      containerStyle={containerStyle}
      {...(!audioMuted && { audioActivityStream: previewStream })}
    >
      <Video
        id="preview"
        forceContainOnMount
        mediaStream={previewStream}
        className={clsm({ '-scale-x-100': videoMirrored })}
      />
      <TileOverlays
        attributes={attributes}
        audioMuted={audioMuted}
        videoHidden={videoHidden}
      />
    </TileContainer>
  );
}

export default memo(ParticipantVideoPreviewTile, deepEqual);
