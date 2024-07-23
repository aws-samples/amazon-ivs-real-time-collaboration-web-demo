import {
  BroadcastClientError,
  BroadcastClientEventPayloads,
  ResolutionConfig,
  VideoComposition
} from 'amazon-ivs-web-broadcast';

interface BroadcastProviderProps {
  children: React.ReactNode;
}

interface BroadcastContext {
  isConnecting: boolean;
  isBroadcasting: boolean;
  broadcastError?: BroadcastClientError;
  previewRef: (canvasEl: HTMLCanvasElement | null) => void;
  startBroadcast: (streamKey: string, ingestEndpoint: string) => Promise<void>;
  stopBroadcast: () => void;
}

interface BroadcastLayer {
  tracks: MediaStreamTrack[];
  position?: VideoComposition;
}

interface BroadcastOverlay {
  overlayName: string;
  getSource: (
    resolutionConfig: ResolutionConfig
  ) => Promise<HTMLImageElement | HTMLCanvasElement>;
  getPosition: (layerPosition: VideoComposition) => VideoComposition;
}

type BroadcastEvent = keyof BroadcastClientEventPayloads;
type BroadcastEventCallback<E extends BroadcastEvent> = (
  value: BroadcastClientEventPayloads[E]
) => void;
type BroadcastEventMap = {
  [E in BroadcastEvent]?: BroadcastEventCallback<E>;
};

export type {
  BroadcastContext,
  BroadcastEventMap,
  BroadcastLayer,
  BroadcastOverlay,
  BroadcastProviderProps
};
