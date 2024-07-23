import { clsm } from '@Utils';
import { useState } from 'react';

import Button from './Button';

type ChangeHandler = (value: string, name: string) => void;

interface FormProps<Fields> {
  initialData: Fields;
  headerText: string;
  submitText: string;
  onSubmit: (fields: Fields) => Promise<void> | void;
  children: (fields: Fields, handleChange: ChangeHandler) => React.ReactNode;
}

function Form<Fields extends Record<string, string>>({
  children,
  onSubmit,
  headerText,
  submitText,
  initialData
}: FormProps<Fields>) {
  const [fields, setFields] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(value: string, name: string) {
    setFields({ ...fields, [name]: value });
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    await onSubmit(fields);
    setIsLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-loading={isLoading}
      className={clsm([
        'peer/form',
        'text-center',
        'flex',
        'flex-col',
        'gap-5'
      ])}
    >
      <h2 className="mb-6">{headerText}</h2>
      {children(fields, handleChange)}
      <Button type="submit" className="mt-6" disabled={isLoading}>
        {submitText}
      </Button>
    </form>
  );
}

export default Form;
