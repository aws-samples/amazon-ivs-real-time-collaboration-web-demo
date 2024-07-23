import { getBestFit } from '@Utils/layout';
import {
  AmazonIVSBroadcastClient,
  BroadcastClientConfig,
  BroadcastClientError,
  Callback,
  create,
  LOG_LEVEL,
  StreamConfig
} from 'amazon-ivs-web-broadcast';

import { createCanvasSource } from './helpers';
import { BroadcastEventMap, BroadcastLayer, BroadcastOverlay } from './types';

const streamConfig: StreamConfig = {
  maxBitrate: 2500,
  maxFramerate: 30,
  maxResolution: { width: 1280, height: 720 }
};
const clientConfig: BroadcastClientConfig = {
  streamConfig,
  logLevel: LOG_LEVEL.ERROR,
  networkReconnectConfig: { reconnect: true }
};

const CONNECTION_TIMEOUT = 10_000; // 10s
const BACKGROUND_CANVAS_COLOR = '#18181b';

class BroadcastClient {
  private static client: AmazonIVSBroadcastClient | undefined;

  private static readonly clientDeps = new Set<string>();

  private static readonly layers = new Map<string, BroadcastLayer>();

  private static readonly layerOverlays = new Map<string, BroadcastOverlay[]>();

  private static connectionTimeoutId?: NodeJS.Timeout;

  private readonly eventMap: BroadcastEventMap = {};

  constructor(eventMap: BroadcastEventMap = {}) {
    this.eventMap = eventMap;

    this.previewRef = this.previewRef.bind(this);
    this.startBroadcast = this.startBroadcast.bind(this);
    this.stopBroadcast = this.stopBroadcast.bind(this);
    this.addLayerTracks = this.addLayerTracks.bind(this);
    this.addLayerOverlay = this.addLayerOverlay.bind(this);
    this.removeLayerTracks = this.removeLayerTracks.bind(this);
    this.removeLayerOverlay = this.removeLayerOverlay.bind(this);
  }

  private static addDependency(dependency: string) {
    BroadcastClient.clientDeps.add(dependency);
  }

  private static removeDependency(dependency: string) {
    BroadcastClient.clientDeps.delete(dependency);

    if (!BroadcastClient.clientDeps.size) {
      BroadcastClient.deleteClient();
    }
  }

  private get client() {
    return BroadcastClient.client || this.createClient();
  }

  private static get created() {
    return !!BroadcastClient.client;
  }

  private createClient() {
    BroadcastClient.client = create(clientConfig);

    // Register event listeners
    Object.entries(this.eventMap).forEach(([event, callback]) => {
      BroadcastClient.client?.on(event, callback as Callback);
    });

    // Add layers and any associated overlays to the broadcast
    for (const layerName of BroadcastClient.layers.keys()) {
      this.addLayerToBroadcast(layerName);
    }

    // Add a canvas background layer
    createCanvasSource({
      fill: BACKGROUND_CANVAS_COLOR,
      width: streamConfig.maxResolution.width,
      height: streamConfig.maxResolution.height
    })
      .then((source) =>
        BroadcastClient.client?.addImageSource(source, 'bg', { index: -1 })
      )
      .catch((error) => console.error('Failed to add background layer', error));

    // Attach the Broadcast client instance on the window for debugging purposes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).broadcastClient = BroadcastClient.client;

    return BroadcastClient.client;
  }

  public static deleteClient(clearLayers = false) {
    clearTimeout(BroadcastClient.connectionTimeoutId);
    BroadcastClient.connectionTimeoutId = undefined;

    BroadcastClient.client?.stopBroadcast();
    BroadcastClient.client?.delete();
    BroadcastClient.client = undefined;
    BroadcastClient.clientDeps.clear();

    if (clearLayers) {
      BroadcastClient.layers.clear();
      BroadcastClient.layerOverlays.clear();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).broadcastClient;
  }

  public previewRef(canvasEl: HTMLCanvasElement | null) {
    if (canvasEl) {
      this.client.attachPreview(canvasEl);
      BroadcastClient.addDependency('preview');
    } else {
      this.client.detachPreview();
      BroadcastClient.removeDependency('preview');
    }
  }

  public async startBroadcast(streamKey: string, ingestEndpoint: string) {
    try {
      if (!streamKey || !ingestEndpoint) {
        throw new Error(
          'Failed to start broadcast stream - missing required configuration.'
        );
      }

      // Resume the audio context before broadcasting to avoid potential
      // audio issues caused by idling on the page for too long
      await this.client.getAudioContext().resume();

      await new Promise<void | BroadcastClientError>((resolve, reject) => {
        BroadcastClient.connectionTimeoutId = setTimeout(() => {
          this.stopBroadcast(); // close the WebRTC connection

          reject(
            new BroadcastClientError({
              name: 'ConnectionTimeoutError',
              code: 9999,
              message: `Broadcast connection attempt timed out after ${
                CONNECTION_TIMEOUT / 1000
              } seconds.`
            })
          );
        }, CONNECTION_TIMEOUT);

        this.client
          .startBroadcast(streamKey, ingestEndpoint)
          .then(resolve)
          .catch(reject);
      });

      BroadcastClient.addDependency('broadcast');
    } catch (error) {
      console.error(error);

      if (error instanceof BroadcastClientError) {
        throw error;
      }
    } finally {
      clearTimeout(BroadcastClient.connectionTimeoutId);
    }
  }

  public stopBroadcast() {
    const isLive = !!this.client.getSessionId();
    if (isLive) {
      BroadcastClient.removeDependency('broadcast');
    }

    this.client.stopBroadcast();
  }

  public async addLayerTracks(layerName: string, tracks: MediaStreamTrack[]) {
    const layer = BroadcastClient.layers.get(layerName);

    if (layer) {
      layer.tracks.push(...tracks);
    } else {
      BroadcastClient.layers.set(layerName, { tracks });
    }

    this.updateLayerCompositions();

    await this.addLayerToBroadcast(layerName);
  }

  public removeLayerTracks(layerName: string, tracks: MediaStreamTrack[]) {
    const layer = BroadcastClient.layers.get(layerName);

    if (!layer) {
      return;
    }

    for (const removedTrack of tracks) {
      const layerIndex = layer.tracks.indexOf(removedTrack);

      if (layerIndex !== -1) {
        layer.tracks.splice(layerIndex, 1);

        if (BroadcastClient.created) {
          if (removedTrack.kind === 'audio') {
            this.client.removeAudioInputDevice(layerName);
          }

          if (removedTrack.kind === 'video') {
            this.client.removeVideoInputDevice(layerName);
          }
        }
      }
    }

    if (!layer.tracks.length) {
      BroadcastClient.layers.delete(layerName);
    }

    this.updateLayerCompositions();
  }

  public async addLayerOverlay(
    layerName: string,
    layerOverlay: BroadcastOverlay
  ) {
    const layerOverlays = BroadcastClient.layerOverlays.get(layerName);

    if (layerOverlays) {
      layerOverlays.push(layerOverlay);
    } else {
      BroadcastClient.layerOverlays.set(layerName, [layerOverlay]);
    }

    await this.addLayerOverlayToBroadcast(layerName, layerOverlay);
  }

  public removeLayerOverlay(layerName: string, overlayName: string) {
    const layerOverlays = BroadcastClient.layerOverlays.get(layerName);

    if (!layerOverlays) {
      return;
    }

    const layerOverlayIndex = layerOverlays.findIndex(
      (layerOverlay) => layerOverlay.overlayName === overlayName
    );

    if (layerOverlayIndex !== -1) {
      layerOverlays.splice(layerOverlayIndex, 1);

      if (BroadcastClient.created) {
        this.client.removeImage(`${layerName}-${overlayName}`);
      }
    }

    if (!layerOverlays?.length) {
      BroadcastClient.layerOverlays.delete(layerName);
    }
  }

  private async addLayerToBroadcast(layerName: string) {
    const layer = BroadcastClient.layers.get(layerName);
    const layerOverlays = BroadcastClient.layerOverlays.get(layerName) || [];

    if (!layer || !BroadcastClient.created) {
      return;
    }

    try {
      const promises: Promise<void>[] = [];

      for (const track of layer.tracks) {
        const stream = new MediaStream([track]);
        const isAudioTrack = track.kind === 'audio';
        const isVideoTrack = track.kind === 'video';
        const hasAudioDevice = !!this.client.getAudioInputDevice(layerName);
        const hasVideoDevice = !!this.client.getVideoInputDevice(layerName);

        if (isAudioTrack && !hasAudioDevice) {
          promises.push(this.client.addAudioInputDevice(stream, layerName));
        }

        if (isVideoTrack && !hasVideoDevice && layer.position) {
          promises.push(
            this.client.addVideoInputDevice(stream, layerName, layer.position)
          );
        }
      }

      for (const layerOverlay of layerOverlays) {
        promises.push(this.addLayerOverlayToBroadcast(layerName, layerOverlay));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error(`Failed to add layer "${layerName}"`, error);
    }
  }

  private async addLayerOverlayToBroadcast(
    layerName: string,
    layerOverlay: BroadcastOverlay
  ) {
    const layer = BroadcastClient.layers.get(layerName);

    if (!layer?.position || !BroadcastClient.created) {
      return;
    }

    const { getSource, overlayName, getPosition } = layerOverlay;
    const name = `${layerName}-${overlayName}`;
    const source = await getSource(streamConfig.maxResolution);
    const position = getPosition(layer.position);

    await this.client.addImageSource(source, name, position);
  }

  private updateLayerCompositions() {
    const layerEntries = Array.from(BroadcastClient.layers.entries());
    const { cols, itemWidth, itemHeight } = getBestFit(
      BroadcastClient.layers.size,
      streamConfig.maxResolution.width,
      streamConfig.maxResolution.height
    );

    for (let i = 0; i < BroadcastClient.layers.size; i += 1) {
      const [layerName, layer] = layerEntries[i];
      const layerOverlays = BroadcastClient.layerOverlays.get(layerName) || [];

      layer.position = {
        index: 0,
        width: itemWidth,
        height: itemHeight,
        x: (i % cols) * itemWidth,
        y: Math.floor(i / cols) * itemHeight
      };

      if (BroadcastClient.created) {
        this.client.updateVideoDeviceComposition(layerName, layer.position);

        for (const layerOverlay of layerOverlays) {
          const { overlayName, getPosition } = layerOverlay;
          const name = `${layerName}-${overlayName}`;
          const position = getPosition(layer.position);

          this.client.updateVideoDeviceComposition(name, position);
        }
      }
    }
  }
}

export default BroadcastClient;
