import cf from '@aws-sdk/client-cloudformation';
import basicSSL from '@vitejs/plugin-basic-ssl';
import reactSWC from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';
import * as vite from 'vite';
import checker from 'vite-plugin-checker';
import environment from 'vite-plugin-environment';
import eslint from 'vite-plugin-eslint';
import * as html from 'vite-plugin-html';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

import config from './shared/config.json';

interface StackExports {
  readonly apiUrl?: string;
  readonly apiRegion?: string;
  readonly appSyncExports?: string;
  readonly cognitoExports?: string;
}

const https = process.env.HTTPS === 'true';
const port = Number(process.env.PORT) || 3000;
const cloudFormation = new cf.CloudFormationClient();

const viteConfig = vite.defineConfig(async ({ mode, command }) => {
  const buildVersion = getBuildVersion(command);
  const stackExports = await getStackExports(mode);

  return {
    build: {
      emptyOutDir: true,
      outDir: path.resolve(process.cwd(), 'build'),
      rollupOptions: { output: { manualChunks } }
    },
    server: { port, strictPort: true, open: '/' },
    plugins: [
      tsconfigPaths(),
      reactSWC(),
      svgr(),
      html.createHtmlPlugin(),
      https && basicSSL({}),
      environment({
        APP_ENV: mode,
        API_URL: stackExports.apiUrl,
        API_REGION: stackExports.apiRegion,
        APPSYNC_EXPORTS: stackExports.appSyncExports,
        COGNITO_EXPORTS: stackExports.cognitoExports,
        BUILD_VERSION: buildVersion
      }),
      eslint({ emitError: command === 'build' }),
      checker({
        typescript: true,
        overlay: { initialIsOpen: false },
        eslint: {
          lintCommand: 'eslint "src/**/*.{js,jsx,ts,tsx,json}"',
          dev: {
            overrideConfig: {
              overrideConfig: {
                rules: {
                  'no-console': 'off',
                  '@typescript-eslint/no-unused-vars': 'off'
                }
              }
            }
          }
        }
      })
    ]
  };
});

function manualChunks(moduleId: string) {
  const vendor = moduleId.split('/node_modules/')[1]?.split('/')[0];
  const vendorChunks = [
    'amazon-ivs-web-broadcast',
    'aws-amplify',
    '@headlessui',
    'tailwindcss',
    'micromark',
    'howler',
    'remix'
  ];

  if (vendor) {
    const vendorChunk = vendorChunks.find((vc) => vendor.includes(vc));

    return vendorChunk ? `vendor_${vendorChunk}` : 'vendor';
  }
}

function getBuildVersion(command: 'build' | 'serve') {
  if (command === 'build') {
    return fs.readFileSync('buildVersion.txt', 'utf8');
  }

  return null;
}

async function getStackExports(mode: string): Promise<StackExports> {
  const stackName = `${config.BACKEND_STACK_PREFIX}-${mode}`;
  const dsCommand = new cf.DescribeStacksCommand({ StackName: stackName });
  const dsResponse = await cloudFormation.send(dsCommand);
  const stackOutputs = dsResponse.Stacks?.[0]?.Outputs ?? [];
  const stackExports = stackOutputs.reduce<Record<string, string>>(
    (exps, output) => {
      const [exportKey] = output.ExportName.split('::').slice(-1);

      return { ...exps, [exportKey]: output.OutputValue };
    },
    {}
  );

  return {
    apiUrl: stackExports.apiUrl,
    apiRegion: stackExports.apiRegion,
    appSyncExports: stackExports.appSyncExports,
    cognitoExports: stackExports.cognitoExports
  };
}

export default viteConfig;
