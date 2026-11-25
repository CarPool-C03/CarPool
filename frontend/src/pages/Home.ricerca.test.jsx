import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, useLocation } from 'react-router';
import { UtenteProvider } from '../auth/UtenteContext.jsx';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import Home from './Home.jsx';

function PercorsoCorrente() {
  const { pathname, search } = useLocation();
  return <output data-testid="percorso">{`${pathname}${search}`}</output>;
}

describe('Home ricerca', () => {
  test('Home: passa i filtri API alla pagina di ricerca', async () => {
    richiesta.mockResolvedValue([{ id: 1, nome: 'Campus di Fisciano' }]);
    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter initialEntries={['/home']}>
          <UtenteProvider
            utenteIniziale={{
              ruolo: 'Membro',
              membro: { id: 5, nome: 'Luca' },
              organizzazione: { id: 9, denominazione: 'Università degli Studi di Salerno' },
            }}
          >
            <Home />
            <PercorsoCorrente />
          </UtenteProvider>
        </MemoryRouter>
      </FluentProvider>,
    );

    fireEvent.focus(screen.getByRole('combobox', { name: 'Destinazione' }));
    await screen.findByRole('option', { name: 'Campus di Fisciano' });
    fireEvent.change(screen.getByLabelText('Partenza'), {
      target: { value: 'Salerno' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Destinazione' }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-12-03' },
    });
    fireEvent.change(screen.getByLabelText('Orario'), {
      target: { value: '08:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }));

    await waitFor(() => {
      expect(screen.getByTestId('percorso')).toHaveTextContent(
        '/ricerca?zona=Salerno&sedeId=1&data=2026-12-03&orarioMinimo=08%3A00',
      );
    });
  });
});
