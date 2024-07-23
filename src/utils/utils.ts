import { getMeetingMessage } from '@Content';
import clsx, { ClassValue } from 'clsx';
import copyToClipboard from 'copy-to-clipboard';
import toast from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';
import resolveConfig from 'tailwindcss/resolveConfig';

import tailwindConfig from '../../tailwind.config';

const utcDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'long',
  timeZone: 'UTC'
});

const resolvedTwConfig = resolveConfig(tailwindConfig);

// https://gist.github.com/dperini/729294
const urlRegex = new RegExp(
  '(?:(?:(?:https?|ftp):)?\\/\\/)?' +
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    '(?:' +
    '(?:' +
    '[a-z0-9\\u00a1-\\uffff]' +
    '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
    ')?' +
    '[a-z0-9\\u00a1-\\uffff]\\.' +
    ')+' +
    '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
    ')' +
    '(?::\\d{2,5})?' +
    '(?:[/?#]\\S*)?',
  'g'
);

function noop() {
  // No operation performed.
}

function clsm(...classes: ClassValue[]) {
  if (!classes) return;

  return twMerge(clsx(classes));
}

function isFulfilled<T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> {
  return input.status === 'fulfilled';
}

function isRejected(
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult {
  return input.status === 'rejected';
}

function queueMacrotask(task: VoidFunction) {
  setTimeout(task, 0);
}

function exhaustiveSwitchGuard(value: never): never {
  throw new Error(
    `ERROR! Reached forbidden guard function with unexpected value: ${JSON.stringify(
      value
    )}`
  );
}

function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  callback: F,
  waitFor: number,
  leading = false
) {
  let timeout: NodeJS.Timeout | undefined;

  function debounced(...args: Parameters<F>) {
    if (leading && !timeout) {
      callback(...args);
    }

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = undefined;

      if (!leading) {
        callback(...args);
      }
    }, waitFor);
  }

  function cancel() {
    clearTimeout(timeout);
    timeout = undefined;
  }

  debounced.cancel = cancel;

  return debounced;
}

function throttle<F extends (...args: Parameters<F>) => ReturnType<F>>(
  callback: F,
  waitFor: number
) {
  let timeout: NodeJS.Timeout | undefined;
  let lastExecTime = 0;

  function throttled(...args: Parameters<F>) {
    const elapsed = Date.now() - lastExecTime;

    const exec = () => {
      lastExecTime = Date.now();
      callback(...args);
    };

    clearTimeout(timeout);

    if (elapsed > waitFor) {
      exec();
    } else {
      timeout = setTimeout(exec, waitFor - elapsed);
    }
  }

  return throttled;
}

function formatMarkdownLinks(rawString: string) {
  return rawString.replace(urlRegex, (match) => {
    const protocolRegex = /^(?:(?:(?:https?|ftp):)?\/\/)/i;

    return protocolRegex.test(match)
      ? `[${match}](${match})`
      : `[${match}](http://${match})`;
  });
}

function copy(text: string) {
  copyToClipboard(text);
  toast.success(getMeetingMessage('copiedToClipboard'), {
    id: 'clipboard'
  });
}

export {
  clsm,
  copy,
  debounce,
  exhaustiveSwitchGuard,
  formatMarkdownLinks,
  isFulfilled,
  isRejected,
  noop,
  queueMacrotask,
  resolvedTwConfig,
  throttle,
  utcDateTimeFormatter
};
