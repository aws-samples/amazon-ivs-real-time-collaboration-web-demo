import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';

// Configure Amplify
Amplify.configure({
  Auth: { Cognito: JSON.parse(process.env.COGNITO_EXPORTS) },
  API: { GraphQL: JSON.parse(process.env.APPSYNC_EXPORTS) }
});

// Configure Axios
axios.defaults.baseURL = process.env.API_URL;
axios.interceptors.request.use(async (config) => {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();

  // eslint-disable-next-line no-param-reassign
  config.headers.Authorization = idToken;

  return config;
});
