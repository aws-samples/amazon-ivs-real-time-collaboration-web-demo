import { IconFullscreenEnter, IconFullscreenExit } from '@Assets/icons';
import { Button } from '@Components';
import { getMeetingMessage } from '@Content';
import { clsm } from '@Utils';
import { analyzeAudio } from '@Utils/audio';
import { useEffect, useRef } from 'react';

import useFullScreen from './useFullScreen';

interface TileContainerProps {
  children: React.ReactNode;
  isScreen?: boolean;
  containerStyle?: React.CSSProperties;
  audioActivityStream?: MediaStream;
}

function TileContainer({
  children,
  containerStyle,
  isScreen = false,
  audioActivityStream
}: TileContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullScreen(
    containerRef,
    isScreen
  );

  useEffect(() => {
    if (audioActivityStream && containerRef.current) {
      return analyzeAudio(audioActivityStream, containerRef.current);
    }
  }, [audioActivityStream, containerRef]);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={clsm([
        '@container',
        'active-audio-base',
        'w-full',
        'h-full',
        'rounded-xl',
        'overflow-hidden',
        'pointer-events-none',
        'bg-zinc-200',
        'dark:bg-zinc-800'
      ])}
    >
      {children}
      {isScreen && (
        <Button
          isIcon
          variant="secondary"
          name="fullscreen-toggle"
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          aria-label={
            isFullscreen
              ? getMeetingMessage('exitFullscreen')
              : getMeetingMessage('enterFullscreen')
          }
          className={clsm([
            'absolute',
            'bottom-2',
            'right-2',
            'pointer-events-auto',
            'backdrop-blur',
            'bg-zinc-50/40',
            'dark:bg-zinc-700/40'
          ])}
        >
          {isFullscreen ? <IconFullscreenExit /> : <IconFullscreenEnter />}
        </Button>
      )}
    </div>
  );
}

export default TileContainer;
