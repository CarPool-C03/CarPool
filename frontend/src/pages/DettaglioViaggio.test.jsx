import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes } from 'react-router';
import { UtenteProvider } from '../auth/UtenteContext.jsx';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import DettaglioViaggio from './DettaglioViaggio.jsx';

const utente = { ruolo: 'Membro', membro: { id: 4, nome: 'Anna' } };

function mostraDettaglio(viaggio) {
  richiesta.mockImplementation((percorso, opzioni = {}) => {
    if (opzioni.metodo === 'POST') {
      return Promise.resolve({ id: 12, stato: 'InAttesa' });
    }
    if (percorso === '/api/richieste/mie') return Promise.resolve({ richieste: [] });
    return Promise.resolve(viaggio);
  });
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={['/viaggi/7']}>
        <UtenteProvider utenteIniziale={utente}>
          <Routes>
            <Route path="/viaggi/:id" element={<DettaglioViaggio />} />
          </Routes>
        </UtenteProvider>
      </MemoryRouter>
    </FluentProvider>,
  );
}

const viaggioBase = {
  id: 7,
  dataOraPartenza: '2026-12-03T08:00:00+01:00',
  puntoPartenza: 'Salerno',
  sede: { id: 1, nome: 'Campus di Fisciano' },
  postiOfferti: 1,
  postiDisponibili: 0,
  contributoIndicativoEuro: null,
  stato: 'Attivo',
  conducente: { id: 9, nome: 'Luca', cognome: 'Verdi' },
};

afterEach(() => vi.clearAllMocks());

describe('Dettaglio viaggio', () => {
  test('Dettaglio viaggio: richiede un posto anche quando non ci sono posti disponibili', async () => {
    mostraDettaglio(viaggioBase);
    const pulsante = await screen.findByRole('button', { name: 'Richiedi posto' });

    fireEvent.click(pulsante);

    expect(await screen.findByText('In attesa')).toBeInTheDocument();
    expect(richiesta).toHaveBeenCalledWith('/api/viaggi/7/richieste', { metodo: 'POST' });
  });

  test('Dettaglio viaggio: non mostra Richiedi posto sul proprio viaggio', async () => {
    mostraDettaglio({
      ...viaggioBase,
      conducente: { ...viaggioBase.conducente, id: utente.membro.id },
    });

    expect(await screen.findByText('Posti disponibili: 0')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Richiedi posto' })).not.toBeInTheDocument();
  });

  test('Dettaglio viaggio: non mostra Richiedi posto per un viaggio non Attivo', async () => {
    mostraDettaglio({ ...viaggioBase, stato: 'Concluso' });

    expect(await screen.findByText('Stato: Concluso')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Richiedi posto' })).not.toBeInTheDocument();
  });
});
