import { TransitionChild } from '@headlessui/react';
import { clsm } from '@Utils';

function Backdrop() {
  return (
    <TransitionChild
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={clsm(['fixed', 'inset-0', 'bg-opacity-25', 'bg-black'])}
      />
    </TransitionChild>
  );
}

export default Backdrop;
