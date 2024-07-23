import { useStageManager } from '@Contexts/StageManager';
import { useContextHook } from '@Hooks';
import {
  BroadcastClientError,
  BroadcastClientEvents,
  ConnectionState,
  StageEvents,
  StageParticipantInfo,
  StageStream,
  StreamType
} from 'amazon-ivs-web-broadcast';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import BroadcastClient from './BroadcastClient';
import {
  createAudioMutedLayerOverlayPreset,
  createVideoStoppedLayerOverlayPreset
} from './layerOverlayPresets';
import { BroadcastContext, BroadcastProviderProps } from './types';

const Context = createContext<BroadcastContext | null>(null);
Context.displayName = 'Broadcast';

function useBroadcast() {
  return useContextHook(Context);
}

function BroadcastProvider({ children }: BroadcastProviderProps) {
  const { user: userStage, display: displayStage } = useStageManager();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<BroadcastClientError>();
  const [client] = useState(
    () =>
      new BroadcastClient({
        [BroadcastClientEvents.ACTIVE_STATE_CHANGE]: setIsBroadcasting,
        [BroadcastClientEvents.ERROR]: setBroadcastError,
        [BroadcastClientEvents.CONNECTION_STATE_CHANGE]: (state) => {
          const { NEW, CONNECTED, CONNECTING, FAILED } = ConnectionState;

          setIsConnecting([NEW, CONNECTING].includes(state as ConnectionState));

          if (state === CONNECTED) {
            setBroadcastError(undefined);
          }

          if (state === FAILED) {
            setIsBroadcasting(false);
          }
        }
      })
  );
  const audioMutedLayerOverlayPreset = useMemo(
    () => createAudioMutedLayerOverlayPreset(client),
    [client]
  );
  const videoStoppedLayerOverlayPreset = useMemo(
    () => createVideoStoppedLayerOverlayPreset(client),
    [client]
  );

  const startBroadcast = useCallback(
    async (streamKey: string, ingestEndpoint: string) => {
      try {
        // Eagerly set the connecting state indicator to true
        setIsConnecting(true);
        setBroadcastError(undefined);

        await client.startBroadcast(streamKey, ingestEndpoint);
      } catch (error) {
        if (error instanceof BroadcastClientError) {
          setBroadcastError(error);
        }

        setIsConnecting(false);
      }
    },
    [client]
  );

  useEffect(() => {
    async function onStreamsAdded(
      participant: StageParticipantInfo,
      streams: StageStream[]
    ) {
      const { id, attributes } = participant;
      const { picture, name } = attributes as Record<string, string>;
      const tracks = streams.map((stream) => stream.mediaStreamTrack);
      await client.addLayerTracks(id, tracks);

      for (const stream of streams) {
        const { streamType, isMuted } = stream;

        if (streamType === StreamType.AUDIO && isMuted) {
          audioMutedLayerOverlayPreset.add(id);
        }

        if (streamType === StreamType.VIDEO && isMuted) {
          videoStoppedLayerOverlayPreset.add(id, picture, name);
        }
      }
    }

    function onStreamsRemoved(
      participant: StageParticipantInfo,
      streams: StageStream[]
    ) {
      const { id } = participant;
      const tracks = streams.map((stream) => stream.mediaStreamTrack);
      client.removeLayerTracks(id, tracks);

      for (const stream of streams) {
        const { streamType } = stream;

        if (streamType === StreamType.AUDIO) {
          audioMutedLayerOverlayPreset.remove(id);
        }

        if (streamType === StreamType.VIDEO) {
          videoStoppedLayerOverlayPreset.remove(id);
        }
      }
    }

    function onMuteChanged(
      participant: StageParticipantInfo,
      stream: StageStream
    ) {
      const { streamType, isMuted } = stream;
      const { id, attributes } = participant;
      const { picture, name } = attributes as Record<string, string>;

      if (streamType === StreamType.AUDIO) {
        if (isMuted) {
          audioMutedLayerOverlayPreset.add(id);
        } else {
          audioMutedLayerOverlayPreset.remove(id);
        }
      }

      if (streamType === StreamType.VIDEO) {
        if (isMuted) {
          videoStoppedLayerOverlayPreset.add(id, picture, name);
        } else {
          videoStoppedLayerOverlayPreset.remove(id);
        }
      }
    }

    [userStage.on, displayStage.on].forEach((on) => {
      on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, onStreamsAdded);
      on(StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED, onStreamsRemoved);
      on(StageEvents.STAGE_STREAM_MUTE_CHANGED, onMuteChanged);
    });

    return () => {
      [userStage.off, displayStage.off].forEach((off) => {
        off(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, onStreamsAdded);
        off(StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED, onStreamsRemoved);
        off(StageEvents.STAGE_STREAM_MUTE_CHANGED, onMuteChanged);
      });
    };
  }, [
    client,
    userStage.connectState,
    userStage.off,
    userStage.on,
    displayStage.connectState,
    displayStage.off,
    displayStage.on,
    audioMutedLayerOverlayPreset,
    videoStoppedLayerOverlayPreset
  ]);

  useEffect(
    () =>
      function cleanUp() {
        BroadcastClient.deleteClient(true);
      },
    []
  );

  const value = useMemo<BroadcastContext>(
    () => ({
      broadcastError,
      isBroadcasting,
      isConnecting,
      previewRef: client.previewRef,
      startBroadcast,
      stopBroadcast: client.stopBroadcast
    }),
    [
      client.previewRef,
      client.stopBroadcast,
      broadcastError,
      isBroadcasting,
      isConnecting,
      startBroadcast
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export { BroadcastProvider, useBroadcast };
