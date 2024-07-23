import { clsm } from '@Utils';

import * as buttonTheme from '../Button/theme';

enum LinkVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  TRANSPARENT = 'transparent'
}

const { BASE_CLASSES } = buttonTheme;

const LIGHT_VARIANT_CLASSES = {
  [LinkVariant.PRIMARY]: clsm([
    buttonTheme.LIGHT_VARIANT_CLASSES[buttonTheme.ButtonVariant.PRIMARY],
    'hover:bg-orange-500'
  ]),
  [LinkVariant.SECONDARY]: clsm([
    buttonTheme.LIGHT_VARIANT_CLASSES[buttonTheme.ButtonVariant.SECONDARY],
    'hover:bg-gray-300'
  ]),
  [LinkVariant.TERTIARY]: clsm([
    buttonTheme.LIGHT_VARIANT_CLASSES[buttonTheme.ButtonVariant.TERTIARY],
    'hover:bg-gray-400'
  ]),
  [LinkVariant.TRANSPARENT]: clsm([
    buttonTheme.LIGHT_VARIANT_CLASSES[buttonTheme.ButtonVariant.TRANSPARENT],
    'hover:bg-gray-300'
  ])
};

const DARK_VARIANT_CLASSES = {
  [LinkVariant.PRIMARY]: clsm([
    buttonTheme.DARK_VARIANT_CLASSES[buttonTheme.ButtonVariant.PRIMARY],
    'hover:bg-orange-500'
  ]),
  [LinkVariant.SECONDARY]: clsm([
    buttonTheme.DARK_VARIANT_CLASSES[buttonTheme.ButtonVariant.SECONDARY],
    'dark:hover:bg-zinc-600'
  ]),
  [LinkVariant.TERTIARY]: clsm([
    buttonTheme.DARK_VARIANT_CLASSES[buttonTheme.ButtonVariant.TERTIARY],
    'dark:hover:bg-zinc-700'
  ]),
  [LinkVariant.TRANSPARENT]: clsm([
    buttonTheme.DARK_VARIANT_CLASSES[buttonTheme.ButtonVariant.TRANSPARENT],
    'dark:hover:bg-zinc-600'
  ])
};

export {
  BASE_CLASSES,
  DARK_VARIANT_CLASSES,
  LIGHT_VARIANT_CLASSES,
  LinkVariant
};
