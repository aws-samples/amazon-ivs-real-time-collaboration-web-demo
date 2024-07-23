import { Form, Input } from '@Components';
import { getAuthMessage, getErrorMessage } from '@Content';
import { signIn } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

type Fields = Record<FieldNames, string>;
type FieldNames = keyof typeof initialData;

const initialData = { username: '', password: '' };

function SignInForm() {
  async function handleSubmit(fields: Fields) {
    try {
      toast.loading(getAuthMessage('signingIn'), { id: 'signIn' });
      await signIn(fields);
    } catch (error) {
      toast.error(getErrorMessage('incorrectCredentials'), { id: 'signIn' });
    }
  }

  return (
    <Form
      onSubmit={handleSubmit}
      initialData={initialData}
      headerText={getAuthMessage('signInToContinue')}
      submitText={getAuthMessage('submitSignIn')}
    >
      {(fields, handleChange) => (
        <>
          <Input
            required
            name="username"
            onChange={handleChange}
            value={fields.username}
            label={getAuthMessage('usernameOrEmail')}
            placeholder={getAuthMessage('enterYourUsernameOrEmail')}
          />
          <Input
            required
            type="password"
            name="password"
            onChange={handleChange}
            value={fields.password}
            label={getAuthMessage('password')}
            placeholder={getAuthMessage('enterYourPassword')}
          />
        </>
      )}
    </Form>
  );
}

export default SignInForm;
