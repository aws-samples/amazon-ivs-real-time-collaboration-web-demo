import { useContextHook } from '@Hooks';
import { createContext, useCallback, useMemo } from 'react';

import { DeviceManagerContext, DeviceManagerProviderProps } from './types';
import useDisplayMedia from './useDisplayMedia';
import useUserMedia from './useUserMedia';

const Context = createContext<DeviceManagerContext | null>(null);
Context.displayName = 'DeviceManager';

function useDeviceManager() {
  return useContextHook(Context);
}

function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  const userMedia = useUserMedia();
  const displayMedia = useDisplayMedia();

  const { stopUserMedia } = userMedia;
  const { stopScreenShare } = displayMedia;
  const stopDevices = useCallback(() => {
    stopUserMedia();
    stopScreenShare();
  }, [stopUserMedia, stopScreenShare]);

  const value = useMemo<DeviceManagerContext>(
    () => ({ userMedia, displayMedia, stopDevices }),
    [userMedia, displayMedia, stopDevices]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export { DeviceManagerProvider, useDeviceManager };
