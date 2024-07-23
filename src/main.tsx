import './index.css';
import './localStorage';
import './api/setup';

import { StrictMode } from 'react';
import ReactDOMClient from 'react-dom/client';

import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOMClient.createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
