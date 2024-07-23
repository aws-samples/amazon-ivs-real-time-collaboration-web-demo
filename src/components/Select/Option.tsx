import { IconCheck } from '@Assets/icons';
import { ListboxOption } from '@headlessui/react';
import { clsm } from '@Utils';

import { Item } from './types';

interface OptionProps<T> {
  data: T;
  disabled?: boolean;
}

function Option<T extends Item>({ data, disabled = false }: OptionProps<T>) {
  return (
    <ListboxOption
      value={data}
      disabled={disabled}
      className={clsm([
        'group',
        'flex',
        'items-center',
        'h-[42px]',
        'pr-4',
        'pl-11',
        'text-sm',
        'rounded-lg',
        'select-none',
        'text-gray-900',
        'dark:text-white',
        'data-[focus]:bg-gray-400',
        'data-[focus]:dark:bg-zinc-600',
        'data-[disabled]:dark:text-zinc-400'
      ])}
    >
      <IconCheck
        className={clsm([
          'absolute',
          'left-3',
          'fill-current',
          'hidden',
          'group-data-[selected]:block'
        ])}
      />
      <span
        className={clsm([
          'block',
          'truncate',
          'font-normal',
          'group-data-[selected]:font-semibold'
        ])}
      >
        {data.label}
      </span>
    </ListboxOption>
  );
}

export default Option;
