import { renderToStaticMarkup } from 'react-dom/server';

function createImageSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(reject, 5000);
    const image = new Image();
    image.referrerPolicy = 'no-referrer';
    image.crossOrigin = 'anonymous';
    image.src = src;

    image.addEventListener(
      'load',
      (e) => {
        clearTimeout(timeoutId);
        resolve(e.target as HTMLImageElement);
      },
      { once: true }
    );

    image.addEventListener('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

async function createCanvasSource({
  width,
  height,
  fill,
  drawings = []
}: {
  width: number;
  height: number;
  fill?: string;
  drawings?: Array<{ svg: React.ReactElement; dx?: number; dy?: number }>;
}): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);
  }

  await Promise.allSettled(
    drawings.map(async ({ svg, dx = 0, dy = 0 }) => {
      let src = '';

      try {
        const mimeType = 'image/svg+xml;charset=utf-8';
        const markup = renderToStaticMarkup(svg);
        const blob = new Blob([markup], { type: mimeType });
        src = URL.createObjectURL(blob);

        const image = await createImageSource(src);
        ctx.drawImage(image, dx, dy);
      } finally {
        URL.revokeObjectURL(src);
      }
    })
  );

  return canvas;
}

export { createCanvasSource, createImageSource };
