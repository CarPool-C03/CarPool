import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UtenteProvider } from '../auth/UtenteContext.jsx';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import DettaglioViaggio from './DettaglioViaggio.jsx';

function viaggio(id, puntoPartenza) {
  return {
    id,
    dataOraPartenza: '2026-12-03T08:00:00+01:00',
    puntoPartenza,
    sede: { id, nome: `Sede ${id}` },
    postiOfferti: 2,
    postiDisponibili: 2,
    contributoIndicativoEuro: null,
    stato: 'Attivo',
    conducente: { id: 7, nome: 'Luca', cognome: 'Verdi' },
  };
}

function differita() {
  let resolve;
  const promise = new Promise((risolvi) => { resolve = risolvi; });
  return { promise, resolve };
}

function NavigazioneViaggi() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/viaggi/42')}>Apri viaggio B</button>;
}

function mostraPagina() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={['/viaggi/41']}>
        <UtenteProvider utenteIniziale={{ ruolo: 'Membro', membro: { id: 4 } }}>
          <NavigazioneViaggi />
          <Routes>
            <Route path="/viaggi/:id" element={<DettaglioViaggio />} />
          </Routes>
        </UtenteProvider>
      </MemoryRouter>
    </FluentProvider>,
  );
}

afterEach(() => vi.clearAllMocks());

describe('Dettaglio viaggio: regressioni al cambio ID', () => {
  test('Cambio ID: il caricamento fallito di B rimuove i dati e l’azione di A', async () => {
    const viaggioA = viaggio(41, 'Partenza A');
    const errore = 'Impossibile caricare il viaggio B';
    richiesta.mockImplementation((percorso) => {
      if (percorso === '/api/viaggi/41') return Promise.resolve(viaggioA);
      if (percorso === '/api/viaggi/42') return Promise.reject(new Error(errore));
      if (percorso === '/api/richieste/mie') return Promise.resolve({ richieste: [] });
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
    mostraPagina();

    expect(await screen.findByText(/Partenza A/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Richiedi posto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apri viaggio B' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(errore);
    expect(screen.queryByText(/Partenza A/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Richiedi posto' }))
      .not.toBeInTheDocument();
  });

  test('GET obsoleta: dopo B, una risposta successiva di A non sostituisce il dettaglio', async () => {
    const richiestaA = differita();
    const richiestaB = differita();
    const viaggioA = viaggio(41, 'Partenza A');
    const viaggioB = viaggio(42, 'Partenza B');
    richiesta.mockImplementation((percorso) => {
      if (percorso === '/api/viaggi/41') return richiestaA.promise;
      if (percorso === '/api/viaggi/42') return richiestaB.promise;
      if (percorso === '/api/richieste/mie') return Promise.resolve({ richieste: [] });
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
    mostraPagina();
    await waitFor(() => expect(richiesta).toHaveBeenCalledWith('/api/viaggi/41'));
    fireEvent.click(screen.getByRole('button', { name: 'Apri viaggio B' }));
    await waitFor(() => expect(richiesta).toHaveBeenCalledWith('/api/viaggi/42'));

    await act(async () => richiestaB.resolve(viaggioB));
    expect(await screen.findByText(/Partenza B/)).toBeInTheDocument();
    await act(async () => richiestaA.resolve(viaggioA));

    expect(screen.getByText(/Partenza B/)).toBeInTheDocument();
    expect(screen.queryByText(/Partenza A/)).not.toBeInTheDocument();
  });

  test('POST obsoleta: la risposta di A non cambia lo stato né l’azione di B', async () => {
    const invioA = differita();
    const viaggioA = viaggio(41, 'Partenza A');
    const viaggioB = viaggio(42, 'Partenza B');
    richiesta.mockImplementation((percorso, opzioni = {}) => {
      if (percorso === '/api/viaggi/41') return Promise.resolve(viaggioA);
      if (percorso === '/api/viaggi/42') return Promise.resolve(viaggioB);
      if (percorso === '/api/richieste/mie') return Promise.resolve({ richieste: [] });
      if (percorso === '/api/viaggi/41/richieste' && opzioni.metodo === 'POST') {
        return invioA.promise;
      }
      throw new Error(`Richiesta inattesa: ${opzioni.metodo ?? 'GET'} ${percorso}`);
    });
    mostraPagina();
    fireEvent.click(await screen.findByRole('button', { name: 'Richiedi posto' }));
    expect(richiesta).toHaveBeenCalledWith('/api/viaggi/41/richieste', { metodo: 'POST' });
    fireEvent.click(screen.getByRole('button', { name: 'Apri viaggio B' }));
    expect(await screen.findByText(/Partenza B/)).toBeInTheDocument();
    const pulsanteB = screen.getByRole('button', { name: 'Richiedi posto' });

    await act(async () => {
      invioA.resolve({ id: 99, stato: 'InAttesa', viaggio: { id: 41, stato: 'Attivo' } });
    });

    expect(screen.getByText(/Partenza B/)).toBeInTheDocument();
    expect(screen.queryByText('In attesa')).not.toBeInTheDocument();
    expect(pulsanteB).toBeInTheDocument();
    expect(pulsanteB).toBeEnabled();
  });
});
