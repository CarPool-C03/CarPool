import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Link, MemoryRouter } from 'react-router';
import App from './App.jsx';

const membro = {
  ruolo: 'Membro',
  membro: { nome: 'Luca' },
  organizzazione: { denominazione: 'Università degli Studi di Salerno' },
};
const larghezzaSchermoPrecedente = window.innerWidth;

const percorsi = {
  visitatore: [
    ['/', /La stessa destinazione/],
    ['/login', 'Login'],
    ['/registrazione', 'Registrazione'],
    ['/registrazione/inviata', 'Controlla la tua e-mail'],
    ['/verifica?token=test', 'Esito della verifica'],
  ],
  membro: [
    ['/home', 'Ciao Luca, dove vai?'],
    ['/ricerca', 'Cerca viaggi'],
    ['/viaggi/1', 'Dettaglio viaggio'],
    ['/viaggi/nuovo', 'Pubblica un viaggio'],
    ['/miei-viaggi', 'I miei viaggi'],
    ['/miei-viaggi/1/modifica', 'Modifica viaggio'],
    ['/miei-viaggi/1/richieste', 'Richieste ricevute'],
    ['/prenotazioni', 'Le mie prenotazioni'],
    ['/valutazioni', 'Da valutare'],
    ['/valutazioni/1', 'Valuta un partecipante'],
    ['/profilo', 'Profilo e veicolo'],
    ['/profilo/veicolo', 'Il mio veicolo'],
  ],
  mobilityManager: [['/report', 'Report PSCL']],
  amministratore: [
    ['/admin', 'Dashboard'],
    ['/admin/organizzazioni', 'Organizzazioni'],
    ['/admin/organizzazioni/nuova', 'Nuova organizzazione'],
    ['/admin/organizzazioni/1', 'Dettaglio organizzazione'],
    ['/admin/membri', 'Membri e ruoli'],
  ],
};

function LinkPercorsi({ voci }) {
  return (
    <nav aria-label="Percorsi di verifica">
      {voci.map(([percorso]) => (
        <Link key={percorso} to={percorso}>
          {`Vai a ${percorso}`}
        </Link>
      ))}
    </nav>
  );
}

async function verificaPercorsi({ utente, voci }) {
  const risposta =
    utente === null
      ? {
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              errore: { codice: 'NON_AUTENTICATO', messaggio: 'Sessione assente' },
            }),
        }
      : {
          ok: true,
          status: 200,
          json: () => Promise.resolve(utente),
        };
  const rispostaViaggio = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      id: 1,
      dataOraPartenza: '2026-12-03T08:00:00+01:00',
      puntoPartenza: 'Salerno, Piazza della Concordia',
      sede: { id: 1, nome: 'Campus di Fisciano' },
      postiOfferti: 4,
      postiDisponibili: 4,
      contributoIndicativoEuro: null,
      stato: 'Attivo',
      conducente: { id: 1, nome: 'Luca', cognome: 'Verdi' },
    }),
  };
  const rispostaProfilo = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      nome: 'Luca',
      cognome: 'Verdi',
      email: 'luca.verdi@example.test',
      organizzazione: {
        id: 1,
        denominazione: 'Università degli Studi di Salerno',
      },
      ruoloMobilityManager: false,
      veicolo: {
        modello: 'Fiat Panda',
        colore: 'Bianco',
        numeroPostiPasseggeri: 4,
      },
      valutazioneMedia: null,
    }),
  };
  const rispostaPubblicazione = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      postiMassimi: 4,
      sedi: [{ id: 1, nome: 'Campus di Fisciano' }],
    }),
  };
  const risposteApi = new Map([
    ['/api/viaggi/1', rispostaViaggio],
    ['/api/profilo', rispostaProfilo],
    ['/api/viaggi/pubblicazione', rispostaPubblicazione],
  ]);
  vi.stubGlobal(
    'fetch',
    vi.fn((percorso) =>
      Promise.resolve(
        risposteApi.get(String(percorso)) ?? risposta,
      ),
    ),
  );
  const erroreConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
  window.innerWidth = 390;
  window.dispatchEvent(new Event('resize'));

  const { unmount } = render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <App />
        <LinkPercorsi voci={voci} />
      </MemoryRouter>
    </FluentProvider>,
  );

  for (const [percorso, titolo] of voci) {
    fireEvent.click(screen.getByRole('link', { name: `Vai a ${percorso}` }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: titolo })).toBeInTheDocument(),
    );
  }

  unmount();
  expect(erroreConsole).not.toHaveBeenCalled();
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.innerWidth = larghezzaSchermoPrecedente;
  window.dispatchEvent(new Event('resize'));
});

describe('Navigazione responsive', () => {
  test('Navigazione: tutte le pagine sono raggiungibili anche da mobile senza errori in console', async () => {
    await verificaPercorsi({ utente: null, voci: percorsi.visitatore });
    await verificaPercorsi({ utente: membro, voci: percorsi.membro });
    await verificaPercorsi({
      utente: { ...membro, ruolo: 'MobilityManager' },
      voci: percorsi.mobilityManager,
    });
    await verificaPercorsi({
      utente: { ruolo: 'Amministratore', membro: null, organizzazione: null },
      voci: percorsi.amministratore,
    });
  });
});
