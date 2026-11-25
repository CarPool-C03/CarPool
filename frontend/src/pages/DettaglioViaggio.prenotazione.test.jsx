import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes } from 'react-router';
import { UtenteProvider } from '../auth/UtenteContext.jsx';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import DettaglioViaggio from './DettaglioViaggio.jsx';

const utente = { ruolo: 'Membro', membro: { id: 4, nome: 'Anna' } };
class ResizeObserverMock { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); }

const viaggioBase = {
  id: 42,
  dataOraPartenza: '2026-12-03T08:00:00+01:00',
  puntoPartenza: 'Salerno, Piazza della Concordia',
  sede: { id: 1, nome: 'Campus di Fisciano' },
  postiOfferti: 3,
  postiDisponibili: 2,
  contributoIndicativoEuro: 3.5,
  stato: 'Attivo',
  conducente: { id: 7, nome: 'Luca', cognome: 'Verdi' },
};

function configuraApi({
  viaggio = viaggioBase,
  richieste = [],
  erroreViaggio,
  erroreRichieste,
  erroreInvio,
} = {}) {
  richiesta.mockImplementation((percorso, opzioni = {}) => {
    const metodo = opzioni.metodo ?? 'GET';
    if (percorso === `/api/viaggi/${viaggio.id}` && metodo === 'GET') {
      return erroreViaggio
        ? Promise.reject(erroreViaggio)
        : Promise.resolve(viaggio);
    }
    if (percorso === '/api/richieste/mie' && metodo === 'GET') {
      return erroreRichieste
        ? Promise.reject(erroreRichieste)
        : Promise.resolve({ richieste });
    }
    if (percorso === `/api/viaggi/${viaggio.id}/richieste` && metodo === 'POST') {
      return erroreInvio
        ? Promise.reject(erroreInvio)
        : Promise.resolve({
            id: 12,
            stato: 'InAttesa',
            viaggio: { id: viaggio.id, stato: viaggio.stato },
          });
    }
    throw new Error(`Richiesta inattesa: ${metodo} ${percorso}`);
  });
}

function mostraDettaglio(viaggio = viaggioBase, opzioni = {}) {
  configuraApi({ ...opzioni, viaggio });
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={[`/viaggi/${viaggio.id}`]}>
        <UtenteProvider utenteIniziale={utente}>
          <Routes>
            <Route path="/viaggi/:id" element={<DettaglioViaggio />} />
          </Routes>
        </UtenteProvider>
      </MemoryRouter>
    </FluentProvider>,
  );
}

beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('Dettaglio viaggio', () => {
  test('Dettaglio: mostra i dati del viaggio e l’azione per un viaggio Attivo altrui', async () => {
    mostraDettaglio();

    expect(await screen.findByRole('heading', { name: 'Dettaglio viaggio' }))
      .toBeInTheDocument();
    expect(screen.getByText('3 dicembre · 08:00')).toBeInTheDocument();
    expect(screen.getByText((_, elemento) =>
      elemento?.tagName === 'SPAN'
      && elemento.textContent.includes('Salerno, Piazza della Concordia')
      && elemento.textContent.includes('Campus di Fisciano'),
    )).toBeInTheDocument();
    expect(screen.getByText(/Luca Verdi/)).toBeInTheDocument();
    expect(screen.getByText('Posti disponibili: 2')).toBeInTheDocument();
    expect(screen.getByText(/Contributo indicativo: 3,50/)).toBeInTheDocument();
    expect(screen.getByText('Attivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Richiedi posto' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(richiesta).toHaveBeenCalledWith('/api/viaggi/42');
    expect(richiesta).toHaveBeenCalledWith('/api/richieste/mie');
  });

  test('TC_TRIP_03.02 - Dettaglio: permette la richiesta anche con zero posti disponibili', async () => {
    mostraDettaglio({ ...viaggioBase, postiDisponibili: 0 });
    fireEvent.click(await screen.findByRole('button', { name: 'Richiedi posto' }));

    expect(await screen.findByText('In attesa')).toBeInTheDocument();
    expect(richiesta).toHaveBeenCalledWith(
      '/api/viaggi/42/richieste',
      { metodo: 'POST' },
    );
    expect(screen.queryByRole('button', { name: 'Richiedi posto' }))
      .not.toBeInTheDocument();
  });

  test('TC_TRIP_03.03 - Dettaglio: non permette la richiesta sul proprio viaggio', async () => {
    mostraDettaglio({
      ...viaggioBase,
      conducente: { ...viaggioBase.conducente, id: utente.membro.id },
    });

    expect(await screen.findByText('Posti disponibili: 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Richiedi posto' }))
      .not.toBeInTheDocument();
  });

  test.each(['Cancellato', 'Concluso'])(
    'TC_TRIP_03.04 - Dettaglio: non permette la richiesta per un viaggio %s',
    async (stato) => {
      mostraDettaglio({ ...viaggioBase, stato });

      expect(await screen.findByText(stato)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Richiedi posto' }))
        .not.toBeInTheDocument();
    },
  );

  test.each([
    ['InAttesa', 'In attesa'],
    ['Accettata', 'Accettata'],
  ])(
    'TC_TRIP_03.05 - Dettaglio: mostra la richiesta %s esistente e non ne consente un’altra',
    async (stato, etichetta) => {
      mostraDettaglio(viaggioBase, {
        richieste: [{
          id: 11,
          stato,
          viaggio: { id: viaggioBase.id },
        }],
      });

      expect(await screen.findByText(etichetta)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Richiedi posto' }))
        .not.toBeInTheDocument();
      expect(richiesta).not.toHaveBeenCalledWith(
        `/api/viaggi/${viaggioBase.id}/richieste`,
        { metodo: 'POST' },
      );
    },
  );

  test.each([
    ['dettaglio viaggio', { erroreViaggio: new Error('Errore dettaglio') }],
    ['richieste personali', { erroreRichieste: new Error('Errore richieste') }],
  ])(
    'Dettaglio: annuncia in modo accessibile un errore nel caricamento delle %s',
    async (_, opzioni) => {
      mostraDettaglio(viaggioBase, opzioni);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        opzioni.erroreViaggio?.message ?? opzioni.erroreRichieste.message,
      );
    },
  );

  test('Dettaglio: annuncia in modo accessibile l’errore API durante l’invio', async () => {
    mostraDettaglio({ ...viaggioBase, postiDisponibili: 0 }, { erroreInvio: new Error('Richiesta già presente') });
    fireEvent.click(await screen.findByRole('button', { name: 'Richiedi posto' }));

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Richiesta già presente');
  });

  test('TC_TRIP_03.05 - HTTP 409 RICHIESTA_GIA_PRESENTE: mostra il MessageBar accessibile sopra il pulsante', async () => {
    const messaggio = 'Hai già una richiesta attiva per questo viaggio';
    const errore = Object.assign(new Error(messaggio), {
      stato: 409, codice: 'RICHIESTA_GIA_PRESENTE', messaggio,
    });
    mostraDettaglio(viaggioBase, { erroreInvio: errore });
    fireEvent.click(await screen.findByRole('button', { name: 'Richiedi posto' }));

    const barra = await screen.findByRole('alert');
    const pulsante = screen.getByRole('button', { name: 'Richiedi posto' });
    expect(richiesta).toHaveBeenCalledWith(
      '/api/viaggi/42/richieste',
      { metodo: 'POST' },
    );
    expect(barra).toHaveTextContent(messaggio);
    expect(barra.className).toContain('fui-MessageBar');
    expect(barra.compareDocumentPosition(pulsante) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });
});
