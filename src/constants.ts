import { SimulcastConfiguration } from 'amazon-ivs-web-broadcast';

const STORAGE_VERSION = '1';

const STAGE_PUBLISHING_CAPACITY = 12;

const DEFAULT_SIMULCAST_CONFIG: SimulcastConfiguration = { enabled: false }; // Note: Simulcast configurations do not apply to screen-shares

const MAX_CHAT_MESSAGE_LENGTH = 500;

export {
  DEFAULT_SIMULCAST_CONFIG,
  MAX_CHAT_MESSAGE_LENGTH,
  STAGE_PUBLISHING_CAPACITY,
  STORAGE_VERSION
};
