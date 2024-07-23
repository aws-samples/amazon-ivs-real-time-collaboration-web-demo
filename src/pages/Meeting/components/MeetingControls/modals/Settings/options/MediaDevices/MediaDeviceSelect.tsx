import { Select } from '@Components';
import { DeviceKind, useDeviceManager } from '@Contexts/DeviceManager';
import { useMemo } from 'react';

interface MediaDeviceSelectProps {
  label: string;
  noDataLabel: string;
  deviceKind: DeviceKind;
}

type MediaDeviceOption = {
  device: MediaDeviceInfo;
  label: string;
  value: string;
};

function MediaDeviceSelect({
  label,
  noDataLabel,
  deviceKind
}: MediaDeviceSelectProps) {
  const { userMedia } = useDeviceManager();
  const devices = userMedia.devices[deviceKind];
  const activeDevice = userMedia.activeDevices[deviceKind];

  const options = useMemo(() => {
    if (!devices) {
      return [];
    }

    return devices.map((device) => ({
      device,
      label: device.label,
      value: device.deviceId
    }));
  }, [devices]);

  const selected = useMemo(
    () => options.find((opt) => opt.value === activeDevice?.deviceId),
    [activeDevice, options]
  );

  function handleDeviceChange(option: MediaDeviceOption) {
    userMedia.updateActiveDevice(deviceKind, option.device);
  }

  return (
    <Select
      label={label}
      options={options}
      selected={selected}
      noDataLabel={noDataLabel}
      onChange={handleDeviceChange}
    />
  );
}

export default MediaDeviceSelect;
