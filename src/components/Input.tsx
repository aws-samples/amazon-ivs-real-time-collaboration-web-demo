import { IconInfoOpen } from '@Assets/icons';
import { clsm } from '@Utils';

import Tooltip from './Tooltip';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  name: string;
  label?: string;
  error?: string;
  description?: string;
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  moreInfo?: React.ReactNode;
  onChange?: (value: string, name: string) => void;
}

function Input({
  name,
  Icon,
  onChange,
  className,
  label,
  error,
  moreInfo,
  description,
  autoCorrect = 'off',
  autoComplete = 'off',
  autoCapitalize = 'none',
  ...restProps
}: InputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(e.target.value, name);
    }
  }

  return (
    <div className={clsm(['flex', 'flex-wrap', 'relative', 'w-full'])}>
      {label && (
        <span
          className={clsm(['flex', 'items-center', 'w-full', 'mb-2', 'gap-1'])}
        >
          <label htmlFor={name} className="font-medium">
            {label}
          </label>
          {moreInfo && (
            <Tooltip id={name} anchor="right" content={moreInfo}>
              <IconInfoOpen
                className={clsm([
                  'w-4',
                  'h-4',
                  'm-px',
                  'shrink-0',
                  'opacity-50',
                  'dark:fill-white'
                ])}
              />
            </Tooltip>
          )}
        </span>
      )}
      <div className={clsm(['relative', 'w-full', 'h-[42px]', 'min-w-[90px]'])}>
        {Icon && (
          <Icon
            className={clsm([
              'absolute',
              'top-1/2',
              'left-4',
              '-translate-y-1/2',
              'pointer-events-none',
              'fill-zinc-500',
              'dark:fill-zinc-400'
            ])}
          />
        )}
        <input
          id={name}
          onChange={handleChange}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          aria-describedby={description && `${name}-description`}
          aria-invalid={!!error}
          className={clsm([
            'px-4',
            'py-2',
            'w-full',
            'h-full',
            'leading-[22.5px]',
            'rounded-full',
            'border-none',
            'appearance-none',
            'transition-all',
            'overflow-hidden',
            'text-ellipsis',
            'whitespace-nowrap',
            'read-only:cursor-auto',
            'disabled:opacity-30',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-inset',
            'focus:ring-black',
            'dark:focus:ring-white',
            'text-gray-900',
            'dark:text-white',
            'bg-gray-200',
            'enabled:hover:bg-gray-300',
            'dark:bg-zinc-700',
            'enabled:dark:hover:bg-zinc-600',
            'placeholder:text-zinc-500',
            'dark:placeholder:text-zinc-400',
            error && ['ring-2', 'ring-inset', 'ring-red-600'],
            Icon && 'pl-[52px]',
            className
          ])}
          {...restProps}
        />
      </div>
      <span
        className={clsm([
          'mt-2',
          'text-xs',
          'text-start',
          'leading-[18px]',
          'space-y-2'
        ])}
      >
        {error && (
          <span className={clsm(['flex', 'gap-1'])}>
            <IconInfoOpen
              className={clsm([
                'w-4',
                'h-4',
                'm-px',
                'shrink-0',
                'rotate-180',
                'fill-red-600'
              ])}
            />
            <p aria-errormessage={name} className="text-red-600">
              {error}
            </p>
          </span>
        )}
        {description && (
          <p id={`${name}-description`} className="opacity-50">
            {description}
          </p>
        )}
      </span>
    </div>
  );
}

export default Input;
