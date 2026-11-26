import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

vi.mock('../api/client.js', () => ({
  ErroreApi: class ErroreApi extends Error {},
  ErroreValidazione: class ErroreValidazione extends Error {},
  richiesta: vi.fn(),
}));

import { richiesta } from '../api/client.js';
import IMieiViaggi from './IMieiViaggi.jsx';
import ModificaViaggio from './ModificaViaggio.jsx';
import RichiesteRicevute from './RichiesteRicevute.jsx';

const viaggio = {
  id: 7,
  stato: 'Attivo',
  dataOraPartenza: '2026-12-03T08:00:00+01:00',
  puntoPartenza: 'Salerno',
  sede: { id: 3, nome: 'Campus' },
  postiOfferti: 3,
  postiDisponibili: 2,
  contributoIndicativoEuro: null,
  conducente: { id: 1, nome: 'Luca', cognome: 'Verdi' },
  richieste: [
    { id: 11, stato: 'Accettata', passeggero: { id: 2, nome: 'Anna', cognome: 'Bianchi' } },
    { id: 12, stato: 'InAttesa', passeggero: { id: 3, nome: 'Marco', cognome: 'Rossi' } },
  ],
};

function mostra(percorso) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={[percorso]}>
        <Percorso />
        <Routes>
          <Route path="/miei-viaggi" element={<IMieiViaggi />} />
          <Route path="/miei-viaggi/:id/modifica" element={<ModificaViaggio />} />
          <Route path="/miei-viaggi/:id/richieste" element={<RichiesteRicevute />} />
        </Routes>
      </MemoryRouter>
    </FluentProvider>,
  );
}

function Percorso() {
  const { pathname } = useLocation();
  return <output data-testid="percorso">{pathname}</output>;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('Gestione dei miei viaggi', () => {
  test('TC_TRIP_04.14 - IMieiViaggi: Modifica disattivato con richieste accettate', async () => {
    richiesta.mockResolvedValue({ attivi: [viaggio], conclusi: [] });
    mostra('/miei-viaggi');

    expect(await screen.findByText('Salerno → Campus')).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Modifica disattivato con richieste accettate',
    })).toBeDisabled();
    expect(screen.getByText('Richieste in attesa: 1')).toBeInTheDocument();
  });

  test('IMieiViaggi: chiede conferma prima di cancellare un viaggio', async () => {
    const conferma = vi.spyOn(window, 'confirm').mockReturnValue(true);
    richiesta.mockImplementation((percorso, opzioni = {}) => (
      opzioni.metodo === 'DELETE'
        ? Promise.resolve(null)
        : Promise.resolve({ attivi: [{ ...viaggio, richieste: [] }], conclusi: [] })
    ));
    mostra('/miei-viaggi');
    await screen.findByText('Salerno → Campus');
    fireEvent.click(screen.getByRole('button', { name: 'Cancella' }));

    await waitFor(() => expect(richiesta).toHaveBeenCalledWith(
      '/api/viaggi/7',
      { metodo: 'DELETE' },
    ));
    expect(conferma).toHaveBeenCalledWith('Vuoi cancellare questo viaggio?');
    expect(screen.queryByText('Salerno → Campus')).not.toBeInTheDocument();
  });

  test('ModificaViaggio: invia i dati aggiornati e torna all’elenco', async () => {
    const modificabile = {
      ...viaggio,
      richieste: [viaggio.richieste[1]],
    };
    richiesta.mockImplementation((percorso, opzioni = {}) => {
      if (percorso === '/api/viaggi/miei') return Promise.resolve({ attivi: [modificabile], conclusi: [] });
      if (percorso === '/api/viaggi/pubblicazione') {
        return Promise.resolve({ postiMassimi: 4, sedi: [{ id: 3, nome: 'Campus' }] });
      }
      if (percorso === '/api/viaggi/7' && opzioni.metodo === 'PUT') return Promise.resolve(viaggio);
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
    mostra('/miei-viaggi/7/modifica');

    fireEvent.click(await screen.findByRole('button', { name: 'Salva modifiche' }));

    await waitFor(() => expect(richiesta).toHaveBeenCalledWith(
      '/api/viaggi/7',
      expect.objectContaining({ metodo: 'PUT' }),
    ));
    await waitFor(() => expect(screen.getByTestId('percorso')).toHaveTextContent(/^\/miei-viaggi$/));
  });

  test('RichiesteRicevute: mostra nomi e stati senza pulsanti di risposta', async () => {
    richiesta.mockResolvedValue({ attivi: [viaggio], conclusi: [] });
    mostra('/miei-viaggi/7/richieste');

    expect(await screen.findByText('Anna Bianchi')).toBeInTheDocument();
    expect(screen.getByText('Stato: Accettata')).toBeInTheDocument();
    expect(screen.getByText('Stato: In attesa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accetta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rifiuta' })).not.toBeInTheDocument();
  });
});
