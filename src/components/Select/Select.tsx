import { Label, Listbox, ListboxOptions } from '@headlessui/react';
import { clsm, noop } from '@Utils';

import Option from './Option';
import SelectButton from './SelectButton';
import { Item } from './types';

interface SelectProps<T> {
  onChange: (value: T) => void;
  label: string;
  noDataLabel?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  options?: Array<T>;
  selected?: T;
}

function Select<T extends Item>({
  label,
  onChange,
  selected,
  options = [],
  noDataLabel = '',
  onClick = noop
}: SelectProps<T>) {
  const noDataItem = { label: noDataLabel || '', value: '' };

  return (
    <Listbox as="div" className="relative" value={selected} onChange={onChange}>
      <div className={clsm(['mb-2', 'font-medium'])}>
        <Label>{label}</Label>
      </div>
      <SelectButton onClick={onClick} selected={selected} />
      <ListboxOptions
        transition
        className={clsm([
          'absolute',
          'z-10',
          'mt-[5px]',
          'w-full',
          'max-h-56',
          'shadow-lg',
          'rounded-lg',
          'overflow-y-auto',
          'focus:outline-none',
          'text-gray-900',
          'dark:text-white',
          'bg-gray-300',
          'dark:bg-zinc-700',
          'data-[enter]:transition',
          'data-[closed]:opacity-0',
          'data-[closed]:-translate-y-1'
        ])}
      >
        {!options.length && <Option disabled data={noDataItem} />}
        {options.map((option) => (
          <Option key={option.value} data={option} />
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

export default Select;
