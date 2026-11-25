import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';
import MembriRuoli from './MembriRuoli.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Membri e ruoli', () => {
  test('Ruolo MM: la richiesta parte solo dopo la conferma', async () => {
    const membro = {
      id: 8,
      nome: 'Luca',
      cognome: 'Verdi',
      email: 'luca@example.test',
      statoAccount: 'Attivo',
      ruoloMobilityManager: false,
      organizzazione: { id: 2, denominazione: 'Partner' },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve([membro]) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ id: membro.id, ruoloMobilityManager: true }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const conferma = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('confirm', conferma);

    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter>
          <MembriRuoli />
        </MemoryRouter>
      </FluentProvider>,
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca per e-mail' }), {
      target: { value: 'luca' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }));
    const assegna = await screen.findByRole('button', { name: 'Assegna Mobility Manager' });

    fireEvent.click(assegna);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(assegna);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(conferma).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Ruolo Mobility Manager: Sì')).toBeInTheDocument();
  });
});
