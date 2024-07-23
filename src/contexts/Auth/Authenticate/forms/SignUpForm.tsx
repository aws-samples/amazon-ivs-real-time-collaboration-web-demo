import { Form, Input } from '@Components';
import { getAuthMessage, getErrorMessage } from '@Content';
import { CognitoException } from '@Shared/types';
import { AuthError, autoSignIn, signUp } from 'aws-amplify/auth';
import { useState } from 'react';
import toast from 'react-hot-toast';

type Fields = Record<FieldNames, string>;
type FieldNames = keyof typeof initialData;
type FieldErrors = Partial<Fields>;

const initialData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
};
const usernameRegex = /^[a-z0-9._]+$/i;
const passwordRegex =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.[\]{}()?\-+"!@#%&/,><':;|_~`])/;

function SignUpForm() {
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(fields: Fields) {
    const validationErrors: FieldErrors = {};

    // Validate the username
    if (!usernameRegex.test(fields.username)) {
      validationErrors.username = getErrorMessage('usernameValidation');
    }

    // Validate the password strength
    if (!passwordRegex.test(fields.password)) {
      validationErrors.password = getErrorMessage('passwordValidation');
    }

    // Validate that the passwords match
    if (fields.password !== fields.confirmPassword) {
      validationErrors.confirmPassword = getErrorMessage('passwordsDoNotMatch');
    }

    setErrors(validationErrors);

    if (!Object.keys(validationErrors).length) {
      await handleSignUp(fields);
    }
  }

  async function handleSignUp(fields: Fields) {
    try {
      toast.loading(getAuthMessage('creatingAccount'), { id: 'signUp' });
      await signUp({
        ...fields,
        options: {
          autoSignIn: true,
          userAttributes: { email: fields.email }
        }
      });

      toast.success(getAuthMessage('createdAccount'), { id: 'signUp' });
      toast.loading(getAuthMessage('signingIn'), { id: 'signIn' });

      await autoSignIn();
    } catch (error) {
      handleSignUpError(error as AuthError);
    }
  }

  function handleSignUpError(error: AuthError) {
    switch (true) {
      case error.name === CognitoException.USERNAME_EXISTS: {
        toast.error(getErrorMessage('usernameExists'), { id: 'signUp' });
        break;
      }

      case error.message.includes(CognitoException.EMAIL_EXISTS): {
        toast.error(getErrorMessage('emailExists'), { id: 'signUp' });
        break;
      }

      case error.message.includes(CognitoException.EMAIL_DOMAIN_FORBIDDEN): {
        toast.error(getErrorMessage('emailDomainForbidden'), { id: 'signUp' });
        break;
      }

      default: {
        toast.error(getErrorMessage('somethingWentWrong'), { id: 'signUp' });
      }
    }
  }

  return (
    <Form
      onSubmit={handleSubmit}
      initialData={initialData}
      headerText={getAuthMessage('signUp')}
      submitText={getAuthMessage('submitSignUp')}
    >
      {(fields, handleChange) => (
        <>
          <Input
            required
            minLength={4}
            maxLength={20}
            name="username"
            onChange={handleChange}
            value={fields.username}
            error={errors.username}
            label={getAuthMessage('username')}
            placeholder={getAuthMessage('enterYourUsername')}
          />
          <Input
            required
            type="email"
            name="email"
            onChange={handleChange}
            value={fields.email}
            error={errors.email}
            label={getAuthMessage('email')}
            placeholder={getAuthMessage('enterYourEmail')}
          />
          <Input
            required
            minLength={8}
            maxLength={64}
            type="password"
            name="password"
            onChange={handleChange}
            value={fields.password}
            error={errors.password}
            label={getAuthMessage('password')}
            placeholder={getAuthMessage('enterYourPassword')}
            description={getAuthMessage('passwordDescription')}
          />
          <Input
            required
            type="password"
            name="confirmPassword"
            onChange={handleChange}
            value={fields.confirmPassword}
            error={errors.confirmPassword}
            label={getAuthMessage('confirmPassword')}
            placeholder={getAuthMessage('confirmYourPassword')}
          />
        </>
      )}
    </Form>
  );
}

export default SignUpForm;
