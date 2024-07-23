import { MeetingParticipantInfo } from '@Shared/types';
import { createAudioDestinationNode, getAudioContext } from '@Utils/audio';
import { deepEqual } from 'fast-equals';
import { memo, useCallback, useRef, useState } from 'react';

import { Audio } from './media';
import { ParticipantAvatarStackPanel } from './panels';
import TileContainer from './TileContainer';

interface ParticipantOverflowTileProps {
  participants: MeetingParticipantInfo[];
  containerStyle?: React.CSSProperties;
}

function ParticipantOverflowTile({
  participants,
  containerStyle
}: ParticipantOverflowTileProps) {
  const [audioDest] = useState(createAudioDestinationNode);
  const audioSources = useRef(new Map<string, MediaStreamAudioSourceNode>());

  const onAudioRemove = useCallback(
    (id: string) => {
      const source = audioSources.current.get(id);
      source?.disconnect(audioDest);
      audioSources.current.delete(id);
    },
    [audioDest]
  );

  const onAudioAdd = useCallback(
    (id: string, mediaStream: MediaStream) => {
      if (audioSources.current.has(id)) {
        onAudioRemove(id);
      }

      const audioContext = getAudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(audioDest);
      audioSources.current.set(id, source);
    },
    [audioDest, onAudioRemove]
  );

  return (
    <TileContainer
      containerStyle={containerStyle}
      audioActivityStream={audioDest?.stream}
    >
      {participants.map(({ id, isLocal, mediaStream }) => (
        <Audio
          id={id}
          key={id}
          muted={isLocal}
          mediaStream={mediaStream}
          onAudioAdd={onAudioAdd}
          onAudioRemove={onAudioRemove}
        />
      ))}
      <ParticipantAvatarStackPanel participants={participants} />
    </TileContainer>
  );
}

export default memo(ParticipantOverflowTile, deepEqual);
