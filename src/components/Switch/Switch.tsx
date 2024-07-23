import { Field, Label, Switch } from '@headlessui/react';
import { clsm } from '@Utils';

interface SwitchGroupProps {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchGroup({
  checked,
  label,
  onChange,
  disabled = false
}: SwitchGroupProps) {
  return (
    <Field>
      <div
        className={clsm([
          'flex',
          'items-center',
          'justify-between',
          'h-[42px]',
          'w-full'
        ])}
      >
        <Label className={clsm(['mr-2', 'grow', 'font-medium', 'truncate'])}>
          {label}
        </Label>
        <Switch
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          className={clsm([
            'w-11',
            'h-6',
            'shrink-0',
            'rounded-full',
            'transition-all',
            'inline-flex',
            'items-center',
            'disabled:cursor-not-allowed',
            'disabled:opacity-30',
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-black',
            'dark:focus-visible:ring-white',
            checked
              ? ['bg-orange-400', 'enabled:hover:bg-orange-500']
              : [
                  'bg-gray-300',
                  'enabled:hover:bg-gray-400',
                  'dark:bg-zinc-700',
                  'enabled:dark:hover:bg-zinc-600'
                ]
          ])}
        >
          <span
            className={clsm([
              'h-4',
              'w-4',
              'inline-block',
              'rounded-full',
              'transform',
              'transition-transform',
              'bg-white',
              checked ? 'translate-x-6' : 'translate-x-1'
            ])}
          />
        </Switch>
      </div>
    </Field>
  );
}

export default SwitchGroup;
