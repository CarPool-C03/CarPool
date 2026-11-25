// Punto di avvio del frontend: tema Fluent UI e router.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { createLightTheme, FluentProvider } from '@fluentui/react-components';
import App from './App.jsx';

const temaVerde = {
  ...createLightTheme({
    10: '#07190A',
    20: '#0C2E10',
    30: '#123E16',
    40: '#1A7120',
    50: '#228B22',
    60: '#2F9830',
    70: '#4AA34A',
    80: '#78BA8B',
    90: '#A1CCAD',
    100: '#C6DECD',
    110: '#DDEADF',
    120: '#EDF4EF',
    130: '#F7FAF8',
    140: '#FBFDFC',
    150: '#FFFFFF',
    160: '#FFFFFF',
  }),
  colorBrandForeground1: '#228B22',
  colorBrandForeground2: '#1A7120',
  colorBrandBackground: '#228B22',
  colorBrandBackgroundHover: '#1A7120',
  colorBrandBackgroundPressed: '#123E16',
  colorBrandBackgroundSelected: '#228B22',
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FluentProvider theme={temaVerde}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FluentProvider>
  </StrictMode>,
);
