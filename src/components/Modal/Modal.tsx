import { IconClose } from '@Assets/icons';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react';
import { clsm } from '@Utils';

import Button from '../Button/Button';
import Backdrop from './Backdrop';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

function Modal({ children, isOpen, onClose, title }: ModalProps) {
  return (
    <Transition appear show={isOpen}>
      <Dialog onClose={onClose}>
        <div className={clsm(['fixed', 'inset-0', 'overflow-y-auto'])}>
          <Backdrop />
          <div
            className={clsm([
              'flex',
              'min-h-full',
              'items-center',
              'justify-center',
              'text-center',
              'p-4'
            ])}
          >
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={clsm([
                  'w-full',
                  'max-w-md',
                  'transform',
                  'p-6',
                  'transition-all',
                  'rounded-xl',
                  'text-left',
                  'align-middle',
                  'shadow-xl',
                  'bg-zinc-100',
                  'dark:bg-zinc-800'
                ])}
              >
                <header
                  className={clsm([
                    'flex',
                    'items-center',
                    'justify-between',
                    'mb-6'
                  ])}
                >
                  <DialogTitle as="h4">{title}</DialogTitle>
                  <Button isIcon variant="transparent" onClick={onClose}>
                    <IconClose />
                  </Button>
                </header>
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;
