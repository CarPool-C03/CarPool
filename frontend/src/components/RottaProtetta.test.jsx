import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { UtenteProvider } from '../auth/UtenteContext.jsx';
import RottaProtetta from './RottaProtetta.jsx';

function mostra(utenteIniziale) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={['/protetta']}>
        <UtenteProvider utenteIniziale={utenteIniziale}>
          <Routes>
            <Route
              path="/protetta"
              element={
                <RottaProtetta>
                  <div>Contenuto protetto</div>
                </RottaProtetta>
              }
            />
            <Route path="/login" element={<div>Pagina login</div>} />
          </Routes>
        </UtenteProvider>
      </MemoryRouter>
    </FluentProvider>,
  );
}

describe('RottaProtetta', () => {
  test('RottaProtetta: senza utente porta al login', () => {
    mostra(null);

    expect(screen.getByText('Pagina login')).toBeInTheDocument();
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });
});
