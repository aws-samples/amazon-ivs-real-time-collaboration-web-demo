import { IconExpand } from '@Assets/icons';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition
} from '@headlessui/react';
import { useBreakpoint } from '@Hooks';
import { WithRequired } from '@Shared/types';
import { clsm } from '@Utils';
import { useMemo } from 'react';
import { Breakpoint } from 'src/hooks/useBreakpoint';

import Button, { ButtonProps } from './Button/Button';
import Ping from './Ping';

interface ButtonGroupProps
  extends Pick<
    ButtonProps,
    'variant' | 'lightVariant' | 'darkVariant' | 'isIcon'
  > {
  buttons: ButtonOptions[];
  collapseAt?: Breakpoint;
  className?: string;
}

interface ButtonOptions extends WithRequired<ButtonProps, 'name'> {
  isHidden?: boolean;
  hasPing?: boolean;
}

function ButtonGroup({
  buttons,
  isIcon,
  variant,
  lightVariant,
  darkVariant,
  className,
  collapseAt = 'nil'
}: ButtonGroupProps) {
  const isCollapsed = useBreakpoint(collapseAt);
  const showPing = buttons.some((button) => button.hasPing);

  const buttonComponents = useMemo(
    () =>
      buttons
        .filter(({ isHidden = false }) => !isHidden)
        .map(({ children, hasPing, isHidden: _isHidden, ...props }) => (
          <Button
            key={props.name}
            isIcon={isIcon}
            variant={variant}
            lightVariant={lightVariant}
            darkVariant={darkVariant}
            {...props}
          >
            {children}
            {hasPing && <Ping />}
          </Button>
        )),
    [buttons, darkVariant, isIcon, lightVariant, variant]
  );

  return isCollapsed ? (
    <Popover className={className}>
      <Transition
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel focus className={clsm(['relative', 'z-[9999]'])}>
          <div
            className={clsm([
              'absolute',
              'flex',
              'flex-col',
              'items-center',
              'justify-center',
              'bottom-14',
              '-left-1',
              'p-1',
              'space-y-1',
              'rounded-full',
              'drop-shadow-xl',
              'ring-1',
              'ring-inset',
              'ring-gray-400',
              'dark:ring-zinc-600',
              'bg-gray-200',
              'dark:bg-zinc-800'
            ])}
          >
            {buttonComponents}
          </div>
        </PopoverPanel>
      </Transition>
      <PopoverButton
        isIcon
        as={Button}
        variant={variant}
        lightVariant="secondary"
        darkVariant="tertiary"
      >
        {({ open }) => (
          <>
            <IconExpand
              className={clsm([
                'transition-transform',
                open ? 'rotate-180' : 'rotate-0'
              ])}
            />
            {!open && showPing && <Ping />}
          </>
        )}
      </PopoverButton>
    </Popover>
  ) : (
    <div className={clsm(['flex', 'gap-x-3'])}>{buttonComponents}</div>
  );
}

export default ButtonGroup;
