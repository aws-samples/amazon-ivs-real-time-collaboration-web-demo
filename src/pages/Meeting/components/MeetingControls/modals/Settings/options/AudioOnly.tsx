import { Switch } from '@Components';
import { getSettingsMessage } from '@Content';
import { useLocalStorage } from '@Hooks';
import { throttle } from '@Utils';
import { useMemo } from 'react';

function AudioOnly() {
  const [audioOnly, storeAudioOnly] = useLocalStorage('audioOnly');

  const handleAudioOnlyChange = useMemo(
    () => throttle((enabled: boolean) => storeAudioOnly(enabled), 300),
    [storeAudioOnly]
  );

  return (
    <Switch
      checked={!!audioOnly}
      onChange={handleAudioOnlyChange}
      label={getSettingsMessage('turnOffIncomingVideo')}
    />
  );
}

export default AudioOnly;
