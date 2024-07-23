import * as pageContent from './messages';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContentKey<Getter extends (key: any) => string> = Parameters<Getter>[0];

interface PageContent {
  [key: string]: {
    text: string;
    note: string;
  };
}

function substitutePlaceholders(
  str: string,
  substitutions: Record<string, string>
) {
  return str.replace(/{(.*?)}/g, (_match, key) => substitutions[key]);
}

function createMessageGetter<P extends PageContent>(page: P) {
  return function get(
    contentKey: keyof typeof page,
    substitutions?: Record<string, string>
  ) {
    const content = page[contentKey];
    const text = content ? content.text : '';

    return substitutions ? substitutePlaceholders(text, substitutions) : text;
  };
}

const {
  auth,
  controls,
  debug,
  error,
  landing,
  meeting,
  meetingEnded,
  meetingPreview,
  settings
} = pageContent;

const getAuthMessage = createMessageGetter(auth);
const getControlsMessage = createMessageGetter(controls);
const getDebugMessage = createMessageGetter(debug);
const getErrorMessage = createMessageGetter(error);
const getLandingMessage = createMessageGetter(landing);
const getMeetingEndedMessage = createMessageGetter(meetingEnded);
const getMeetingMessage = createMessageGetter(meeting);
const getMeetingPreviewMessage = createMessageGetter(meetingPreview);
const getSettingsMessage = createMessageGetter(settings);

export type { ContentKey };

export {
  getAuthMessage,
  getControlsMessage,
  getDebugMessage,
  getErrorMessage,
  getLandingMessage,
  getMeetingEndedMessage,
  getMeetingMessage,
  getMeetingPreviewMessage,
  getSettingsMessage
};
