import { getSettingsMessage } from '@Content';
import { DeviceKind } from '@Contexts/DeviceManager';

import MediaDeviceSelect from './MediaDeviceSelect';

function MediaDevices() {
  return (
    <>
      <MediaDeviceSelect
        deviceKind={DeviceKind.AUDIO}
        noDataLabel={getSettingsMessage('noMicrophonesFound')}
        label={getSettingsMessage('microphone')}
      />
      <MediaDeviceSelect
        deviceKind={DeviceKind.VIDEO}
        noDataLabel={getSettingsMessage('noCamerasFound')}
        label={getSettingsMessage('camera')}
      />
    </>
  );
}

export default MediaDevices;
