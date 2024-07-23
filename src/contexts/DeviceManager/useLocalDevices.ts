import { getControlsMessage } from '@Content';
import { useLocalStorage } from '@Hooks';
import { debounce } from '@Utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { enumerateDevices, requestUserMediaPermissions } from './helpers';
import {
  ActiveDevices,
  DeviceKind,
  Devices,
  MediaToggles,
  UserMediaError
} from './types';

const { mediaDevices } = navigator;

/**
 * Manages the devices connected to the local machine
 */
function useLocalDevices({ toggleAudio, toggleVideo }: MediaToggles) {
  const [devices, setDevices] = useState<Devices>({});
  const [deviceSettings = {}] = useLocalStorage('devices');
  const [activeDevices, setActiveDevices] = useState<ActiveDevices>({});
  const [userMediaError, setUserMediaError] = useState<UserMediaError>();
  const discoveredDevices = useRef(new Map<string, Set<string>>());

  const updateActiveDevice = useCallback(
    (deviceKind: DeviceKind, activeDevice?: MediaDeviceInfo) => {
      setActiveDevices((prevActiveDevices) => {
        const prevActiveDevice = prevActiveDevices[deviceKind];

        return prevActiveDevice?.deviceId !== activeDevice?.deviceId
          ? { ...prevActiveDevices, [deviceKind]: activeDevice }
          : prevActiveDevices;
      });
    },
    []
  );

  const startLocalDevices = useCallback(async () => {
    const deviceIds = deviceSettings.deviceIds ?? {};
    let grantedDevices: { audio?: string; video?: string } = {};
    let initialDevices: Devices = {};

    async function onGranted(mediaStream?: MediaStream) {
      setUserMediaError(undefined);

      initialDevices = await enumerateDevices();
      setDevices(initialDevices);

      const grantedTracks = mediaStream?.getTracks() ?? [];
      grantedDevices = grantedTracks.reduce<{
        audio?: string;
        video?: string;
      }>((acc, { label, kind }) => ({ ...acc, [kind]: label }), {});
    }

    function onDenied() {
      setUserMediaError('permissionsDenied');
    }

    await requestUserMediaPermissions({ deviceIds, onGranted, onDenied });

    const initialActiveDevices = (
      Object.entries(initialDevices) as Array<[DeviceKind, MediaDeviceInfo[]]>
    ).reduce<Partial<Record<DeviceKind, MediaDeviceInfo>>>(
      (acc, [deviceKind, devicesList]) => {
        const grantedDeviceLabel = grantedDevices[deviceKind];
        const storedDeviceId = deviceIds[deviceKind];
        const initialActiveDevice =
          devicesList.find((d) => d.label === grantedDeviceLabel) || // 1. Specific device for which permissions were granted (Firefox only)
          devicesList.find((d) => d.deviceId === storedDeviceId) || // 2. Device stored in local storage as a user preference
          devicesList.find((d) => d.deviceId === 'default') || // 3. Default device in the list
          devicesList[0]; // 4. First device in the list

        if (initialActiveDevice) {
          updateActiveDevice(deviceKind, initialActiveDevice);
        }

        return { ...acc, [deviceKind]: initialActiveDevice };
      },
      {}
    );

    return initialActiveDevices;
  }, [deviceSettings.deviceIds, updateActiveDevice]);

  const refreshDevices = useCallback(async () => {
    const nextDevices = await enumerateDevices();

    setDevices((prevDevices) => {
      Object.values(DeviceKind).forEach((deviceKind) => {
        const activeDevice = activeDevices[deviceKind];
        const prevDevicesList = prevDevices[deviceKind] ?? [];
        const nextDevicesList = nextDevices[deviceKind] ?? [];

        if (prevDevicesList.length > nextDevicesList.length) {
          // Device was disconnected
          const [disconnectedDevice] = prevDevicesList.filter(
            (prevDevice) =>
              nextDevicesList.findIndex(
                (nextDevice) => prevDevice.deviceId === nextDevice.deviceId
              ) === -1
          );

          if (disconnectedDevice.deviceId === activeDevice?.deviceId) {
            // Disconnected device was active -> switch to the next device in the list
            const nextActiveDevice =
              nextDevicesList.find((d) => d.deviceId === 'default') ||
              nextDevicesList[0];

            // Before switching to the next active device, mute/hide the current state.
            // This also ensures that we reach a sensible state even if there is no nextActiveDevice.
            if (deviceKind === DeviceKind.AUDIO) {
              toggleAudio({ muted: true });
            } else if (deviceKind === DeviceKind.VIDEO) {
              toggleVideo({ stopped: true });
            }

            updateActiveDevice(deviceKind, nextActiveDevice);

            const { label, groupId } = disconnectedDevice;
            toast.error(
              getControlsMessage('deviceDisconnected', { device: label }),
              { id: groupId, duration: 5000 }
            );
          }
        } else if (prevDevicesList.length < nextDevicesList.length) {
          // New device was connected
          const [connectedDevice] = nextDevicesList.filter(
            (nextDevice) =>
              prevDevicesList.findIndex(
                (prevDevice) => prevDevice.deviceId === nextDevice.deviceId
              ) === -1
          );

          const { label, groupId, deviceId } = connectedDevice;
          const discoveredSet = discoveredDevices.current.get(groupId);
          const discovered = !!discoveredSet?.has(deviceId);

          // Update the active device only if the newly connected device
          // has not been discovered this session
          if (!discovered) {
            updateActiveDevice(deviceKind, connectedDevice);

            toast.success(
              getControlsMessage('deviceConnected', { device: label }),
              { id: groupId, duration: 5000 }
            );
          }
        }
      });

      return nextDevices;
    });
  }, [activeDevices, toggleAudio, toggleVideo, updateActiveDevice]);

  useEffect(() => {
    const deviceInfoList: MediaDeviceInfo[] = Object.values(devices).flat();

    for (const { groupId, deviceId } of deviceInfoList) {
      const discoveredSet = discoveredDevices.current.get(groupId) ?? new Set();

      discoveredSet.add(deviceId);
      discoveredDevices.current.set(groupId, discoveredSet);
    }
  }, [devices]);

  useEffect(() => {
    // mediaDevices is available only in secure contexts
    if (!mediaDevices) {
      return;
    }

    /**
     * A devicechange event is sent to a MediaDevices instance whenever a media device such
     * as a camera, microphone, or speaker is connected to or removed from the system
     */
    const onDeviceChange = debounce(refreshDevices, 1000);
    mediaDevices.addEventListener('devicechange', onDeviceChange);

    return () => {
      mediaDevices.removeEventListener('devicechange', onDeviceChange);
      onDeviceChange.cancel();
    };
  }, [refreshDevices]);

  return {
    devices,
    activeDevices,
    userMediaError,
    startLocalDevices,
    updateActiveDevice
  };
}

export default useLocalDevices;
