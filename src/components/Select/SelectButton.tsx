import { IconUnfoldMore } from '@Assets/icons';
import { ListboxButton } from '@headlessui/react';
import { clsm, noop } from '@Utils';

import { Item } from './types';

interface SelectButtonProps<T> {
  selected?: T;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

function SelectButton<T extends Item>({
  selected,
  onClick = noop
}: SelectButtonProps<T>) {
  return (
    <ListboxButton
      onClick={onClick}
      className={clsm([
        'relative',
        'w-full',
        'h-[42px]',
        'pl-4',
        'pr-10',
        'py-2',
        'text-left',
        'rounded-lg',
        'transition-all',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-inset',
        'focus-visible:ring-black',
        'dark:focus-visible:ring-white',
        'text-gray-900',
        'dark:text-white',
        'bg-gray-300',
        'hover:bg-gray-400',
        'dark:bg-zinc-700',
        'dark:hover:bg-zinc-600'
      ])}
    >
      <span className={clsm(['block', 'truncate', 'font-normal'])}>
        {selected?.label}
      </span>
      <span
        className={clsm([
          'absolute',
          'right-0',
          'flex',
          'items-center',
          'inset-y-0',
          'pr-2',
          'pointer-events-none'
        ])}
      >
        <IconUnfoldMore className="fill-current" />
      </span>
    </ListboxButton>
  );
}

export default SelectButton;
