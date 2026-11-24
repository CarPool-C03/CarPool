// Punto di avvio del frontend: tema Fluent UI e router.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FluentProvider>
  </StrictMode>,
);
