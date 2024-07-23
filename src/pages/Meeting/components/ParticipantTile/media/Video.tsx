import { clsm, noop } from '@Utils';
import { getComputedVideoStyle } from '@Utils/layout';
import React, { useCallback, useState } from 'react';

interface VideoProps {
  id: string;
  isScreen?: boolean;
  className?: string;
  mediaStream?: MediaStream;
  forceContainOnMount?: boolean;
  onMediaLoaded?: (loaded: boolean) => void;
}

function Video({
  id,
  isScreen,
  className,
  mediaStream,
  onMediaLoaded = noop,
  forceContainOnMount = false
}: VideoProps) {
  const [isForceContained, setIsForceContained] = useState(forceContainOnMount);

  const updateVideoSource = useCallback(
    (videoEl: HTMLMediaElement | null) => {
      if (videoEl && mediaStream) {
        onMediaLoaded(false);
        videoEl.srcObject = mediaStream; // eslint-disable-line no-param-reassign
      }
    },
    [mediaStream, onMediaLoaded]
  );

  /**
   * Some autoPlay policies may prevent the video element from automatically playing the mediaStream.
   * Calling `play()` once the frame at the current playback position of the mediaStream has finished
   * loading ensures that we play the mediaStream as soon as we have sufficient data to do so.
   */
  async function onLoadedData(e: React.SyntheticEvent<HTMLMediaElement>) {
    await (e.target as HTMLMediaElement).play();
    onMediaLoaded(true);
  }

  function onClick(event: React.MouseEvent<HTMLVideoElement>) {
    // Capture double-click on non-screen videos
    if (!isScreen && event.detail % 2 === 0) {
      setIsForceContained((prev) => !prev);
    }
  }

  return (
    <video
      id={`video-${id}`}
      muted
      autoPlay
      playsInline
      disablePictureInPicture
      preload="auto"
      controls={false}
      onClick={onClick}
      ref={updateVideoSource}
      onLoadedData={onLoadedData}
      style={getComputedVideoStyle(isScreen)}
      className={clsm([
        'w-full',
        'h-full',
        'rounded-xl',
        'pointer-events-auto',
        'bg-zinc-200',
        'dark:bg-zinc-800',
        isForceContained && '!object-contain',
        className
      ])}
    />
  );
}

export default Video;
