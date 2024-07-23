import { Switch } from '@Components';
import { getSettingsMessage } from '@Content';
import { VideoMirrorMode } from '@Contexts/DeviceManager';
import { useLocalStorage } from '@Hooks';

function MirrorVideo() {
  const [deviceSettings = {}, storeDeviceSettings] = useLocalStorage('devices');
  const videoMirrorMode =
    deviceSettings.videoMirrorMode ?? VideoMirrorMode.DISABLED;

  function handlePreviewVideoMirrorChange(enabled: boolean) {
    const mode = enabled ? VideoMirrorMode.PREVIEW : VideoMirrorMode.DISABLED;
    storeDeviceSettings((settings) => ({ ...settings, videoMirrorMode: mode }));
  }

  function handlePublishedVideoMirrorChange(enabled: boolean) {
    const mode = enabled ? VideoMirrorMode.PUBLISHED : VideoMirrorMode.PREVIEW;
    storeDeviceSettings((settings) => ({ ...settings, videoMirrorMode: mode }));
  }

  return (
    <>
      <Switch
        checked={videoMirrorMode !== VideoMirrorMode.DISABLED}
        onChange={handlePreviewVideoMirrorChange}
        label={getSettingsMessage('mirrorMyVideo')}
      />
      <Switch
        checked={videoMirrorMode === VideoMirrorMode.PUBLISHED}
        onChange={handlePublishedVideoMirrorChange}
        label={getSettingsMessage('shareMyMirroredVideo')}
      />
    </>
  );
}

export default MirrorVideo;
