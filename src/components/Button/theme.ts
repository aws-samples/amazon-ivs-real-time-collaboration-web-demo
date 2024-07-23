import { clsm } from '@Utils';

enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  TRANSPARENT = 'transparent',
  DESTRUCTIVE = 'destructive'
}

const BASE_CLASSES = clsm([
  'relative',
  'px-6',
  'py-3',
  'h-[42px]',
  'text-base',
  'font-bold',
  'not-italic',
  'leading-[19px]',
  'cursor-pointer',
  'rounded-full',
  'flex',
  'items-center',
  'justify-center',
  'flex-nowrap',
  'whitespace-nowrap',
  'select-none',
  'border-none',
  'transition',
  'disabled:cursor-not-allowed',
  'disabled:opacity-30',
  '[&>svg]:fill-current',
  'text-black',
  'dark:text-white',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-inset',
  'focus-visible:ring-black',
  'dark:focus-visible:ring-white'
]);

const ICON_CLASSES = clsm([
  'p-0',
  '[&>svg]:w-6',
  '[&>svg]:h-6',
  'aspect-square'
]);

const LIGHT_VARIANT_CLASSES = {
  [ButtonVariant.PRIMARY]: clsm([
    '!text-black',
    'bg-orange-400',
    'focus-visible:bg-orange-500',
    'enabled:hover:bg-orange-500'
  ]),
  [ButtonVariant.SECONDARY]: clsm([
    'bg-gray-200',
    'focus-visible:bg-gray-300',
    'enabled:hover:bg-gray-300'
  ]),
  [ButtonVariant.TERTIARY]: clsm([
    'bg-gray-300',
    'focus-visible:bg-gray-400',
    'enabled:hover:bg-gray-400'
  ]),
  [ButtonVariant.TRANSPARENT]: clsm([
    'bg-transparent',
    'focus-visible:bg-gray-300',
    'enabled:hover:bg-gray-300'
  ]),
  [ButtonVariant.DESTRUCTIVE]: clsm([
    '!text-white',
    'bg-red-600',
    'focus-visible:bg-red-700',
    'enabled:hover:bg-red-700'
  ])
};

const DARK_VARIANT_CLASSES = {
  [ButtonVariant.PRIMARY]: clsm([
    '!text-black',
    'bg-orange-400',
    'focus-visible:bg-orange-500',
    'enabled:hover:bg-orange-500'
  ]),
  [ButtonVariant.SECONDARY]: clsm([
    'dark:bg-zinc-700',
    'dark:focus-visible:bg-zinc-600',
    'enabled:dark:hover:bg-zinc-600'
  ]),
  [ButtonVariant.TERTIARY]: clsm([
    'dark:bg-zinc-800',
    'dark:focus-visible:bg-zinc-700',
    'enabled:dark:hover:bg-zinc-700'
  ]),
  [ButtonVariant.TRANSPARENT]: clsm([
    'bg-transparent',
    'dark:focus-visible:bg-zinc-600',
    'enabled:dark:hover:bg-zinc-600'
  ]),
  [ButtonVariant.DESTRUCTIVE]: clsm([
    '!text-white',
    'bg-red-600',
    'dark:focus-visible:bg-red-500',
    'enabled:dark:hover:bg-red-500'
  ])
};

export {
  BASE_CLASSES,
  ButtonVariant,
  DARK_VARIANT_CLASSES,
  ICON_CLASSES,
  LIGHT_VARIANT_CLASSES
};
