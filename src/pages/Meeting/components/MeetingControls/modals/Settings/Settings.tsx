import { Button, Modal } from '@Components';
import { getSettingsMessage } from '@Content';

import {
  AudioOnlySetting,
  MediaDeviceSetting,
  MirrorVideoSetting
} from './options';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function Settings({ isOpen, onClose }: SettingsProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getSettingsMessage('settings')}
    >
      <div className="space-y-5">
        <MediaDeviceSetting />
        <MirrorVideoSetting />
        <AudioOnlySetting />
        {/*
            Uncomment to add a setting for enabling/disabling Simulcast. 
            
            READ BEFORE ADDING THIS SETTING: 
            https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/real-time-streaming-optimization.html#real-time-streaming-optimization-adaptive
          
            <SimulcastSetting />
          */}
      </div>
      <footer className="mt-8">
        <Button className="w-full" onClick={onClose}>
          {getSettingsMessage('done')}
        </Button>
      </footer>
    </Modal>
  );
}

export default Settings;
