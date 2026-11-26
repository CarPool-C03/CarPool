// Punto di avvio del frontend: tema Fluent UI e router.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { FluentProvider } from '@fluentui/react-components';
import App from './App.jsx';

import { temaCarPool } from './styles/tema.js';
import './styles/base.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FluentProvider className="carpool" theme={temaCarPool}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FluentProvider>
  </StrictMode>,
);
