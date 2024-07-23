import { MeetingParticipantAttributes, StreamMetadata } from '@Shared/types';
import { deepEqual } from 'fast-equals';
import { memo, useState } from 'react';

import { Audio, Video } from './media';
import TileContainer from './TileContainer';
import TileOverlays from './TileOverlays';

interface ParticipantVideoTileProps {
  id: string;
  attributes: MeetingParticipantAttributes;
  mediaStream?: MediaStream;
  isLocal?: boolean;
  isScreen?: boolean;
  audioMuted?: boolean;
  videoStopped?: boolean;
  streamMetadata?: StreamMetadata;
  containerStyle?: React.CSSProperties;
}

function ParticipantVideoTile({
  id,
  attributes,
  mediaStream,
  videoStopped,
  containerStyle,
  isLocal = false,
  isScreen = false,
  audioMuted = false,
  streamMetadata = { audioOnly: false }
}: ParticipantVideoTileProps) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const videoHidden = !mediaLoaded || videoStopped || streamMetadata.audioOnly;

  return (
    <TileContainer
      isScreen={isScreen}
      containerStyle={containerStyle}
      {...(!audioMuted && !isScreen && { audioActivityStream: mediaStream })}
    >
      <Audio id={id} mediaStream={mediaStream} muted={audioMuted || isLocal} />
      <Video
        id={id}
        isScreen={isScreen}
        mediaStream={mediaStream}
        onMediaLoaded={setMediaLoaded}
      />
      <TileOverlays
        attributes={attributes}
        audioMuted={audioMuted}
        videoHidden={videoHidden}
      />
    </TileContainer>
  );
}

export default memo(ParticipantVideoTile, deepEqual);
