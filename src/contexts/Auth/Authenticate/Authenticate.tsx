import { Button, Toast } from '@Components';
import { getAuthMessage } from '@Content';
import { Transition } from '@headlessui/react';
import { clsm } from '@Utils';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { SignInForm, SignUpForm } from './forms';

type Form = 'sign-in' | 'sign-up';

const baseFormTransitionClasses = clsm([
  'transition',
  'ease-in-out',
  'duration-200',
  'data-[closed]:opacity-0'
]);

function Authenticate() {
  const [form, setForm] = useState<Form | null>('sign-in');
  const containerRef = useRef<HTMLDivElement>(null);

  function switchForm() {
    setForm(null); // Triggers "afterLeave" on the visible Transition form component
    toast.dismiss();
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderFormSwitcher(text: string) {
    return (
      <Button
        onClick={switchForm}
        variant="transparent"
        className={clsm([
          'mt-2',
          'w-full',
          'opacity-50',
          'hover:opacity-100',
          'focus-visible:opacity-100',
          'peer-data-[loading=true]/form:invisible'
        ])}
      >
        {text}
      </Button>
    );
  }

  return (
    <main
      ref={containerRef}
      className={clsm([
        'fixed',
        'inset-0',
        'flex',
        'px-4',
        'py-8',
        'overflow-y-auto'
      ])}
    >
      <Toast />
      <div className={clsm(['m-auto', 'w-full', 'max-w-[420px]'])}>
        <Transition
          as="div"
          show={form === 'sign-in'}
          afterLeave={() => setForm('sign-up')}
          className={clsm([
            baseFormTransitionClasses,
            'data-[closed]:-translate-x-4'
          ])}
        >
          <SignInForm />
          {renderFormSwitcher(getAuthMessage('createAnAccount'))}
        </Transition>
        <Transition
          as="div"
          show={form === 'sign-up'}
          afterLeave={() => setForm('sign-in')}
          className={clsm([
            baseFormTransitionClasses,
            'data-[closed]:translate-x-4'
          ])}
        >
          <SignUpForm />
          {renderFormSwitcher(getAuthMessage('signIn'))}
        </Transition>
      </div>
    </main>
  );
}

export default Authenticate;
