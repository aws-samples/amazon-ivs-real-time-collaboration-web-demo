import { Stack } from 'aws-cdk-lib';
import path from 'path';

function createExportName(stack: Stack, id: string) {
  return `${stack.stackName}::${id}`;
}

function createResourceName(stack: Stack, id: string) {
  return `${stack.stackName}-${id}`;
}

function getLambdaEntryPath(functionName: string) {
  return path.format({
    dir: path.resolve(import.meta.dirname, '../lambdas/handlers'),
    name: functionName,
    ext: '.ts'
  });
}

function isObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function deepMerge(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...sources: Array<Record<string, any>>
) {
  if (!sources.length) {
    return target;
  }

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    Object.entries(source).forEach(([key, value]) => {
      if (isObject(value)) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }

        deepMerge(target[key] as Record<string, unknown>, value);
      } else {
        Object.assign(target, { [key]: value });
      }
    });
  }

  return deepMerge(target, ...sources);
}

export { createExportName, createResourceName, deepMerge, getLambdaEntryPath };
