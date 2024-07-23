import cp from 'child_process';
import fs from 'fs';
import path from 'path';

const appEnv = process.env.APP_ENV;

if (!appEnv) throw new Error('APP_ENV is missing.');

const npmListCommand = 'npm ls amazon-ivs-web-broadcast --json';
const npmList = JSON.parse(cp.execSync(npmListCommand, { encoding: 'utf8' }));
const sdkVersion = npmList.dependencies['amazon-ivs-web-broadcast'].version;
const timestamp = Math.round(Date.now() / 1000);
const buildVersion = `${sdkVersion}/${appEnv}/${timestamp}`;
const buildVersionPath = path.resolve(process.cwd(), 'buildVersion.txt');

fs.writeFileSync(buildVersionPath, buildVersion);
