import { Button, Input, Modal } from '@Components';
import { getMeetingMessage } from '@Content';
import { useBroadcast } from '@Contexts/Broadcast';
import { useLocalStorage } from '@Hooks';
import { clsm } from '@Utils';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface GoLiveProps {
  isOpen: boolean;
  onClose: () => void;
}

function GoLive({ isOpen, onClose }: GoLiveProps) {
  const {
    isBroadcasting,
    isConnecting,
    previewRef,
    startBroadcast,
    stopBroadcast,
    broadcastError
  } = useBroadcast();
  const [storedIngestEndpoint = '', storeIngestEndpoint] =
    useLocalStorage('ingestEndpoint');
  const [ingestEndpoint, setIngestEndpoint] = useState(storedIngestEndpoint);
  const [streamKey, setStreamKey] = useState('');

  function handleStartStream(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isConnecting || !ingestEndpoint) {
      return;
    }

    startBroadcast(streamKey, ingestEndpoint);
  }

  function onCancel() {
    onClose();
    stopBroadcast(); // close the WebRTC connection
    toast.dismiss(`broadcast/${broadcastError?.name}`);
    toast.dismiss(`broadcast/fallback`);
  }

  useEffect(() => {
    if (isBroadcasting) {
      storeIngestEndpoint(ingestEndpoint);
      onClose();
    }
  }, [ingestEndpoint, isBroadcasting, onClose, storeIngestEndpoint]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={getMeetingMessage('goLiveTitle')}
    >
      <canvas
        ref={previewRef}
        className={clsm(['w-full', 'rounded-lg', 'aspect-video', 'mb-5'])}
      />
      <form className="space-y-5" onSubmit={handleStartStream}>
        <Input
          required
          name="ingestEndpoint"
          value={ingestEndpoint}
          onChange={setIngestEndpoint}
          label={getMeetingMessage('broadcastIngestEndpoint')}
          placeholder="a1b2c3d4e5f6.global-contribute.live-video.net"
        />
        <Input
          required
          name="streamKey"
          value={streamKey}
          onChange={setStreamKey}
          label={getMeetingMessage('broadcastStreamKey')}
          placeholder="sk_us-west-2_abcd1234_abcdef567890"
        />
        <footer
          className={clsm([
            'flex',
            'pt-3',
            'gap-2',
            '[&>button]:w-full',
            'sm:flex-col-reverse'
          ])}
        >
          <Button onClick={onCancel} variant="secondary">
            {getMeetingMessage('cancelBroadcast')}
          </Button>
          <Button isLoading={isConnecting} type="submit">
            {getMeetingMessage('startBroadcast')}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

export default GoLive;
