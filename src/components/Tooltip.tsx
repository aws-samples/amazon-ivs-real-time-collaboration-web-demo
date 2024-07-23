import {
  Popover,
  PopoverButton,
  PopoverPanel,
  PopoverPanelProps,
  Transition
} from '@headlessui/react';
import { clsm } from '@Utils';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface TooltipRenderProps {
  open: boolean;
  disabled: boolean;
}

interface TooltipProps {
  id: string;
  content: React.ReactNode;
  children: React.ReactNode | ((props: TooltipRenderProps) => React.ReactNode);
  anchor?: Extract<PopoverPanelProps['anchor'], string>;
  disabled?: boolean;
}

function Tooltip({
  id,
  content,
  children,
  disabled = false,
  anchor = 'bottom'
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const renderProps: TooltipRenderProps = { open: show, disabled };

  function handleEnter(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault();
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(setShow, 500, true);
  }

  function handleLeave(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault();
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(setShow, 150, false);
  }

  useEffect(() => {
    if (disabled) {
      setShow(false);
    }
  }, [disabled]);

  useLayoutEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.ariaExpanded = show ? 'true' : 'false';
    }
  }, [show]);

  return (
    <Popover
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={clsm([
        'max-w-fit',
        'overflow-hidden',
        disabled ? 'pointer-events-none' : 'pointer-events-auto'
      ])}
    >
      {/* The popover button is permanently disabled since only hover events will control visibility  */}
      <PopoverButton as="div" ref={buttonRef} aria-describedby={id} disabled>
        {children instanceof Function ? children(renderProps) : children}
      </PopoverButton>
      <Transition
        show={show}
        enter="transition ease-out duration-200"
        enterFrom={clsm([
          'opacity-0',
          {
            'translate-y-1': anchor?.split(' ')[0] === 'top',
            '-translate-y-1': anchor?.split(' ')[0] === 'bottom',
            'translate-x-1': anchor?.split(' ')[0] === 'left',
            '-translate-x-1': anchor?.split(' ')[0] === 'right'
          }
        ])}
        enterTo="opacity-100 translate-x-0 translate-y-0"
      >
        <PopoverPanel
          id={id}
          role="tooltip"
          anchor={{ to: anchor, gap: 4 }}
          className={clsm([
            'z-[9999]',
            'p-1.5',
            'px-2',
            'text-sm',
            'font-medium',
            'rounded-lg',
            '!max-w-72',
            'drop-shadow-lg',
            'text-current',
            'bg-gray-50',
            'dark:bg-zinc-800',
            'ring-1',
            'ring-inset',
            'ring-gray-400',
            'dark:ring-zinc-700'
          ])}
        >
          {content}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}

export default Tooltip;
