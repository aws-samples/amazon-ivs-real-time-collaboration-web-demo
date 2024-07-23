import { getMeetingMessage } from '@Content';
import { clsm, queueMacrotask } from '@Utils';
import { useEffect } from 'react';
import toast, {
  ToastBar,
  Toaster,
  ToasterProps,
  useToasterStore
} from 'react-hot-toast';

import Spinner from './Spinner';

const DEFAULT_TOAST_LIMIT = 5;

interface ToastProps extends ToasterProps {
  toastLimit?: number;
}

function Toast({
  toastOptions,
  toastLimit = DEFAULT_TOAST_LIMIT,
  ...restToasterProps
}: ToastProps) {
  const { toasts } = useToasterStore();

  // Dismiss earlier toasts when `toastLimit` is exceeded
  useEffect(() => {
    toasts.forEach(({ visible, id }, i) => {
      if (visible && i >= toastLimit) {
        toast.dismiss(id);
      }
    });
  }, [toastLimit, toasts]);

  // Remove all toasts on unmount
  useEffect(
    () =>
      function removeToasts() {
        // Delayed to handle Toaster race conditions
        queueMacrotask(toast.remove);
      },
    []
  );

  return (
    <Toaster
      toastOptions={{
        ...toastOptions,
        className: clsm([
          '!text-current',
          '!bg-zinc-200',
          'dark:!bg-zinc-700',
          toastOptions?.className
        ]),
        success: {
          iconTheme: { primary: '#16a34a', secondary: '#09090b' },
          ...toastOptions?.success
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#09090b' },
          ...toastOptions?.error
        },
        loading: {
          icon: <Spinner className={clsm(['w-4', 'h-4'])} />,
          ...toastOptions?.loading
        }
      }}
      {...restToasterProps}
    >
      {(t) => {
        function handleToastCommand(e: React.SyntheticEvent<HTMLDivElement>) {
          if (
            e.nativeEvent instanceof KeyboardEvent &&
            e.nativeEvent.key !== 'Enter' &&
            e.nativeEvent.key !== ' '
          ) {
            e.preventDefault();

            return;
          }

          toast.dismiss(t.id);
        }

        return (
          <ToastBar
            toast={t}
            style={{
              padding: 0,
              transitionProperty: 'all',
              transitionDuration: '500ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {({ icon, message }) => (
              <div
                role="button"
                tabIndex={0}
                onClick={handleToastCommand}
                onKeyDown={handleToastCommand}
                aria-label={getMeetingMessage('dismissNotification')}
                className={clsm([
                  'flex',
                  'flex-row',
                  'items-center',
                  'justify-center',
                  'flex-nowrap',
                  'whitespace-nowrap',
                  'border-0',
                  'py-2',
                  'px-[10px]',
                  'text-start',
                  'w-full',
                  'h-full',
                  'rounded-xl',
                  'bg-transparent',
                  'focus-visible:outline-none',
                  'focus-visible:ring-2',
                  'focus-visible:ring-inset',
                  'focus-visible:ring-black',
                  'dark:focus-visible:ring-white'
                ])}
              >
                {icon}
                {message}
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}

export type { ToastProps };

export default Toast;
