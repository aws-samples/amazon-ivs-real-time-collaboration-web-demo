import { Transition } from '@headlessui/react';
import { usePortal } from '@Hooks';
import { clsm } from '@Utils';
import { useLayoutEffect } from 'react';
import { toast } from 'react-hot-toast';

import Spinner from './Spinner';

interface PageSpinnerProps {
  pageId: string; // ensures that PageSpinner portals rendered consecutively do not conflict with each other
  isLoading?: boolean;
  loadingText?: string;
  unmount?: boolean;
  children?: JSX.Element | JSX.Element[];
}

function PageSpinner({
  pageId,
  children,
  loadingText,
  unmount = true,
  isLoading = false
}: PageSpinnerProps) {
  const [Portal, isPortalRendered] = usePortal({
    id: `page-loader-${pageId}`,
    isOpen: isLoading
  });

  useLayoutEffect(() => {
    if (isPortalRendered) {
      toast.dismiss();
    }
  }, [isPortalRendered]);

  return (
    <>
      <Portal className={clsm(['fixed', 'h-dvh', 'w-screen', 'inset-0'])}>
        <Transition
          show
          appear
          as="div"
          className={clsm([
            'flex',
            'flex-col',
            'gap-y-4',
            'items-center',
            'justify-center',
            'h-full',
            'w-full',
            'transition',
            'duration-200',
            'text-center',
            'font-medium',
            'text-gray-900',
            'dark:text-white',
            'bg-gray-50',
            'dark:bg-zinc-900',
            !unmount && [
              'bg-white/70',
              'dark:bg-black/70',
              'data-[closed]:opacity-0'
            ]
          ])}
        >
          <Spinner />
          {loadingText}
        </Transition>
      </Portal>
      {(!isPortalRendered || !unmount) && children}
    </>
  );
}

export default PageSpinner;
