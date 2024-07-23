import { noop } from '@Utils';
import { memo, useCallback } from 'react';

interface AudioProps {
  id: string;
  muted?: boolean;
  mediaStream?: MediaStream;
  onAudioAdd?: (id: string, mediaStream: MediaStream) => void;
  onAudioRemove?: (id: string) => void;
}

function Audio({
  id,
  muted,
  mediaStream,
  onAudioAdd = noop,
  onAudioRemove = noop
}: AudioProps) {
  const updateAudioSource = useCallback(
    (audioEl: HTMLAudioElement | null) => {
      if (audioEl) {
        if (mediaStream) {
          audioEl.srcObject = mediaStream; // eslint-disable-line no-param-reassign
          onAudioAdd(id, mediaStream);
        }
      } else onAudioRemove(id);
    },
    [id, mediaStream, onAudioAdd, onAudioRemove]
  );

  /**
   * Some autoPlay policies may prevent the audio element from automatically playing the mediaStream.
   * Calling `play()` once the frame at the current playback position of the mediaStream has finished
   * loading ensures that we play the mediaStream as soon as we have sufficient data to do so.
   */
  function onLoadedData(e: React.SyntheticEvent<HTMLAudioElement>) {
    (e.target as HTMLAudioElement).play();
  }

  return (
    <audio
      id={`audio-${id}`}
      autoPlay
      preload="auto"
      controls={false}
      muted={muted}
      ref={updateAudioSource}
      onLoadedData={onLoadedData}
    />
  );
}

export default memo(Audio);
