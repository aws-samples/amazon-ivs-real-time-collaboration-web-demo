import { IconAccount, IconMicOffAlt } from '@Assets/icons';
import BoringAvatar from 'boring-avatars';

import BroadcastClient from './BroadcastClient';
import { createCanvasSource, createImageSource } from './helpers';

function createAudioMutedLayerOverlayPreset(client: BroadcastClient) {
  return {
    add: (layerName: string) =>
      client.addLayerOverlay(layerName, {
        overlayName: 'audio-muted',
        getSource: ({ width: canvasWidth, height: canvasHeight }) => {
          const iconSize = canvasWidth / 20;
          const iconPadding = 8;

          return createCanvasSource({
            width: canvasWidth,
            height: canvasHeight,
            drawings: [
              {
                svg: <IconMicOffAlt width={iconSize} height={iconSize} />,
                dx: canvasWidth - iconSize - iconPadding,
                dy: iconPadding
              }
            ]
          });
        },
        getPosition: (layerPosition) => ({
          ...layerPosition,
          index: layerPosition.index + 2
        })
      }),
    remove: (layerName: string) =>
      client.removeLayerOverlay(layerName, 'audio-muted')
  };
}

function createVideoStoppedLayerOverlayPreset(client: BroadcastClient) {
  return {
    add: (layerName: string, src?: string, name?: string) => {
      const pendingLayers: Promise<void>[] = [];

      pendingLayers.push(
        client.addLayerOverlay(layerName, {
          overlayName: 'video-stopped-bg',
          getSource: (resolutionConfig) =>
            createCanvasSource({ ...resolutionConfig, fill: '#3f3f46' }),
          getPosition: (layerPosition) => ({
            ...layerPosition,
            index: layerPosition.index + 1
          })
        })
      );

      if (src || name) {
        pendingLayers.push(
          client.addLayerOverlay(layerName, {
            overlayName: 'video-stopped-profile',
            getSource: async ({ width: canvasWidth, height: canvasHeight }) => {
              const size = Math.min(canvasWidth, canvasHeight);

              if (src) {
                try {
                  const image = await createImageSource(src);
                  const canvas = document.createElement('canvas');
                  canvas.width = size;
                  canvas.height = size;

                  const ctx = canvas.getContext(
                    '2d'
                  ) as CanvasRenderingContext2D;
                  ctx.drawImage(image, 0, 0, size, size);
                  ctx.globalCompositeOperation = 'destination-in';
                  ctx.beginPath();
                  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                  ctx.closePath();
                  ctx.fill();

                  return canvas;
                } catch (error) {
                  // Continue to fallback layer
                }
              } else if (name) {
                return createCanvasSource({
                  width: size,
                  height: size,
                  drawings: [
                    {
                      svg: (
                        <BoringAvatar name={name} size={size} variant="beam" />
                      )
                    }
                  ]
                });
              }

              // Fallback layer
              return createCanvasSource({
                width: size,
                height: size,
                drawings: [{ svg: <IconAccount width={size} height={size} /> }]
              });
            },
            getPosition: ({
              index: layerIndex,
              width: layerWidth = 0,
              height: layerHeight = 0,
              x: layerX = 0,
              y: layerY = 0
            }) => {
              const index = layerIndex + 1;
              const width = layerWidth / 3;
              const height = layerHeight / 3;
              const x = layerX + (layerWidth - width) / 2;
              const y = layerY + (layerHeight - height) / 2;

              return { index, width, height, x, y };
            }
          })
        );
      }

      return Promise.all(pendingLayers);
    },
    remove: (layerName: string) => {
      client.removeLayerOverlay(layerName, 'video-stopped-bg');
      client.removeLayerOverlay(layerName, 'video-stopped-profile');
    }
  };
}

export {
  createAudioMutedLayerOverlayPreset,
  createVideoStoppedLayerOverlayPreset
};
