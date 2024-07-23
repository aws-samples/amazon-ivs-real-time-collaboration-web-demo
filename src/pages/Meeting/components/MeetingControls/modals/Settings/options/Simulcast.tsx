import { PageSpinner, Switch } from '@Components';
import { getSettingsMessage } from '@Content';
import { useStageManager } from '@Contexts/StageManager';
import { useLocalStorage } from '@Hooks';
import {
  SimulcastConfiguration,
  StageConnectionState
} from 'amazon-ivs-web-broadcast';
import { useState } from 'react';
import toast from 'react-hot-toast';

const { CONNECTED } = StageConnectionState;

function Simulcast() {
  const { user: userStage } = useStageManager();
  const [simulcast, storeSimulcast] = useLocalStorage('simulcast');
  const [isSimulcastLoading, setIsSimulcastLoading] = useState(false);
  const isLoading = userStage.connectState === CONNECTED && isSimulcastLoading;

  async function handleSimulcastChange(enabled: boolean) {
    if (isSimulcastLoading) {
      return;
    }

    setIsSimulcastLoading(true);

    try {
      const config: SimulcastConfiguration = { ...simulcast, enabled };
      await userStage.setSimulcast(config);
      storeSimulcast(config);

      toast.success(
        enabled
          ? getSettingsMessage('simulcastEnabled')
          : getSettingsMessage('simulcastDisabled'),
        { id: 'simulcastSuccess' }
      );
    } catch (error) {
      toast.error(getSettingsMessage('simulcastApplyConfigError'), {
        id: 'simulcastError'
      });
    }

    setIsSimulcastLoading(false);
  }

  return (
    <PageSpinner isLoading={isLoading} pageId="SimulcastSetting">
      <Switch
        checked={!!simulcast?.enabled}
        onChange={handleSimulcastChange}
        label={getSettingsMessage('simulcast')}
      />
    </PageSpinner>
  );
}

export default Simulcast;
