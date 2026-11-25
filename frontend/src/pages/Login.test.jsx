import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { UtenteProvider } from '../auth/UtenteContext.jsx';
import Login from './Login.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Login', () => {
  test('Login: mostra l’errore con credenziali errate', async () => {
    const messaggio = 'E-mail o password non validi';
    class ResizeObserverMock {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            errore: { codice: 'CREDENZIALI_NON_VALIDE', messaggio },
          }),
      }),
    );

    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter>
          <UtenteProvider utenteIniziale={null}>
            <Login />
          </UtenteProvider>
        </MemoryRouter>
      </FluentProvider>,
    );
    fireEvent.change(screen.getByLabelText(/E-mail istituzionale/i), {
      target: { value: 'utente@test.local' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password-sbagliata' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));

    await waitFor(() => expect(screen.getByText(messaggio)).toBeInTheDocument());
  });
});
