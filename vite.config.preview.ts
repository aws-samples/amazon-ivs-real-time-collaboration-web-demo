import basicSSL from '@vitejs/plugin-basic-ssl';
import path from 'path';
import * as vite from 'vite';

const https = process.env.HTTPS === 'true';
const port = Number(process.env.PORT) || 3000;

// Minimal Vite preview config
const viteConfig = vite.defineConfig({
  build: { outDir: path.resolve(process.cwd(), 'build') },
  preview: { port, strictPort: true, open: '/' },
  plugins: [https && basicSSL()]
});

export default viteConfig;
