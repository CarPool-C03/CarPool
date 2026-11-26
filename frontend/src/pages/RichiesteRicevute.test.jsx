import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes } from 'react-router';

vi.mock('../api/client.js', () => ({
  ErroreApi: class ErroreApi extends Error {},
  richiesta: vi.fn(),
}));

import { richiesta } from '../api/client.js';
import RichiesteRicevute from './RichiesteRicevute.jsx';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const viaggio = {
  id: 7,
  stato: 'Attivo',
  dataOraPartenza: '2026-12-03T08:00:00+01:00',
  puntoPartenza: 'Salerno',
  sede: { id: 3, nome: 'Campus' },
  postiOfferti: 3,
  postiDisponibili: 2,
  conducente: { id: 1, nome: 'Luca', cognome: 'Verdi' },
  richieste: [
    { id: 12, stato: 'InAttesa', passeggero: { id: 2, nome: 'Marco', cognome: 'Russo' } },
    { id: 13, stato: 'InAttesa', passeggero: { id: 3, nome: 'Sara', cognome: 'Galli' } },
  ],
};

function mostra() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={['/miei-viaggi/7/richieste']}>
        <Routes>
          <Route path="/miei-viaggi/:id/richieste" element={<RichiesteRicevute />} />
        </Routes>
      </MemoryRouter>
    </FluentProvider>,
  );
}

beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Richieste ricevute', () => {
  test('TC_TRIP_06.03 - RichiesteRicevute: mostra l’errore posti esauriti e mantiene la richiesta in attesa', async () => {
    const messaggio = 'I posti offerti sono esauriti';
    richiesta.mockImplementation((percorso) => {
      if (percorso === '/api/viaggi/miei') {
        return Promise.resolve({ attivi: [viaggio], conclusi: [] });
      }
      if (percorso === '/api/richieste/12/accetta') {
        return Promise.reject(new Error(messaggio));
      }
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
    mostra();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Accetta' }))[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent(messaggio);
    expect(screen.getAllByText('Stato: In attesa')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Accetta' })).toHaveLength(2);
  });

  test('RichiesteRicevute: Accetta e Rifiuta aggiornano lo stato della richiesta', async () => {
    richiesta.mockImplementation((percorso, opzioni = {}) => {
      if (percorso === '/api/viaggi/miei') {
        return Promise.resolve({ attivi: [viaggio], conclusi: [] });
      }
      if (percorso === '/api/richieste/12/accetta') {
        return Promise.resolve({ id: 12, stato: 'Accettata', postiDisponibili: 1 });
      }
      if (percorso === '/api/richieste/13/rifiuta') {
        return Promise.resolve({ id: 13, stato: 'Rifiutata' });
      }
      throw new Error(`Richiesta inattesa: ${percorso} ${opzioni.metodo}`);
    });
    mostra();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Accetta' }))[0]);
    expect(await screen.findByText('Stato: Accettata')).toBeInTheDocument();
    expect(screen.getByText('Posti residui: 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Rifiuta' }));
    expect(await screen.findByText('Stato: Rifiutata')).toBeInTheDocument();
    expect(richiesta).toHaveBeenCalledWith(
      '/api/richieste/12/accetta',
      { metodo: 'POST' },
    );
    expect(richiesta).toHaveBeenCalledWith(
      '/api/richieste/13/rifiuta',
      { metodo: 'POST' },
    );
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Rifiuta' })).not.toBeInTheDocument();
    });
  });
});
