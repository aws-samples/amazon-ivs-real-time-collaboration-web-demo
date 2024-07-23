import { MutableRefObject, useCallback, useEffect, useState } from 'react';

function useFullScreen(
  targetRef: MutableRefObject<HTMLElement | null>,
  enabled = true
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    if (targetRef.current) {
      await targetRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  }, [targetRef]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement !== null) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const targetEl = targetRef.current;

    if (!targetEl || !enabled) return;

    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    targetEl.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      targetEl.removeEventListener('fullscreenchange', onFullscreenChange);
      exitFullscreen();
    };
  }, [enabled, exitFullscreen, targetRef]);

  return { isFullscreen, enterFullscreen, exitFullscreen };
}

export default useFullScreen;
