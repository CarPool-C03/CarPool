import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';
import Registrazione from './Registrazione.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Registrazione', () => {
  test('Registrazione: mostra gli errori sotto i campi', async () => {
    const errori = [
      { campo: 'cognome', messaggio: 'Il cognome è obbligatorio' },
      { campo: 'email', messaggio: 'Formato e-mail non valido' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errori }),
      }),
    );

    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter>
          <Registrazione />
        </MemoryRouter>
      </FluentProvider>,
    );
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Mario' } });
    fireEvent.change(screen.getByLabelText('Cognome'), { target: { value: 'Rossi' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'mario.rossi@studenti.unisa.it' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password-di-test-47!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crea account' }));

    await waitFor(() => {
      expect(screen.getByText('Il cognome è obbligatorio')).toBeInTheDocument();
      expect(screen.getByText('Formato e-mail non valido')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Cognome')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/E-mail/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Cognome').getAttribute('aria-describedby')).toBe(
      screen.getByText('Il cognome è obbligatorio').id,
    );
    expect(screen.getByLabelText(/E-mail/i).getAttribute('aria-describedby')).toBe(
      screen.getByText('Formato e-mail non valido').id,
    );
  });
});
