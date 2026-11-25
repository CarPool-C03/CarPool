import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

vi.mock('../api/client.js', () => ({
  ErroreApi: class ErroreApi extends Error {
    constructor({ stato, codice, messaggio }) {
      super(messaggio);
      Object.assign(this, { stato, codice, messaggio });
    }
  },
  ErroreValidazione: class ErroreValidazione extends Error {
    constructor(errori) {
      super('Dati non validi');
      this.errori = errori;
    }
  },
  richiesta: vi.fn(),
}));

import { ErroreApi, ErroreValidazione, richiesta } from '../api/client.js';
import PubblicaViaggio from './PubblicaViaggio.jsx';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function PercorsoCorrente() {
  const { pathname } = useLocation();
  return <output data-testid="percorso">{pathname}</output>;
}

function mostraPagina() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={['/viaggi/nuovo']}>
        <PercorsoCorrente />
        <Routes>
          <Route path="/viaggi/nuovo" element={<PubblicaViaggio />} />
          <Route path="/viaggi/:id" element={<p>Dettaglio del viaggio</p>} />
        </Routes>
      </MemoryRouter>
    </FluentProvider>,
  );
}

function configuraApi({ erroreVeicolo, erroriValidazione, viaggio }) {
  richiesta.mockImplementation((percorso, { metodo = 'GET' } = {}) => {
    if (percorso === '/api/profilo' && metodo === 'GET') {
      return Promise.resolve({
        nome: 'Luca',
        cognome: 'Verdi',
        email: 'luca.verdi@example.test',
        organizzazione: {
          id: 1,
          denominazione: 'Università degli Studi di Salerno',
        },
        ruoloMobilityManager: false,
        veicolo: erroreVeicolo
          ? null
          : {
              modello: 'Fiat Panda',
              colore: 'Bianco',
              numeroPostiPasseggeri: 4,
            },
        valutazioneMedia: null,
      });
    }
    if (percorso === '/api/viaggi/pubblicazione' && metodo === 'GET') {
      if (erroreVeicolo) return Promise.reject(erroreVeicolo);
      return Promise.resolve({
        postiMassimi: 4,
        sedi: [{ id: 1, nome: 'Campus di Fisciano' }],
      });
    }
    if (percorso === '/api/viaggi' && metodo === 'POST') {
      if (erroriValidazione) return Promise.reject(erroriValidazione);
      return Promise.resolve(viaggio);
    }
    throw new Error(`Richiesta inattesa: ${metodo} ${percorso}`);
  });
}

async function completaModulo() {
  await screen.findByLabelText('Partenza da');
  fireEvent.change(screen.getByLabelText('Partenza da'), {
    target: { value: 'Salerno, Piazza della Concordia' },
  });
  fireEvent.change(screen.getByLabelText('Sede di destinazione'), {
    target: { value: '1' },
  });
  fireEvent.change(screen.getByLabelText('Data'), {
    target: { value: '2026-12-03' },
  });
  fireEvent.change(screen.getByLabelText('Orario di partenza'), {
    target: { value: '08:00' },
  });
  fireEvent.change(screen.getByLabelText('Posti offerti'), {
    target: { value: '2' },
  });
}

describe('Pubblica viaggio', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    richiesta.mockReset();
    richiesta.mockResolvedValue({
      postiMassimi: 4,
      sedi: [{ id: 1, nome: 'Campus di Fisciano' }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('Pubblicazione: senza veicolo mostra avviso e collegamento al profilo', async () => {
    configuraApi({
      erroreVeicolo: new ErroreApi({
        stato: 409,
        codice: 'VEICOLO_ASSENTE',
        messaggio: 'Per pubblicare un viaggio inserisci prima i dati del veicolo',
      }),
    });
    mostraPagina();

    expect(await screen.findByText(
      'Per pubblicare un viaggio inserisci prima i dati del veicolo',
    )).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inserisci i dati del veicolo' }))
      .toHaveAttribute(
      'href',
      '/profilo/veicolo',
    );
    expect(screen.queryByLabelText('Partenza da')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pubblica un viaggio' }))
      .not.toBeInTheDocument();
  });

  test('Pubblicazione: errori API mostrati sotto i campi corrispondenti', async () => {
    configuraApi({
      erroriValidazione: new ErroreValidazione([
        { campo: 'puntoPartenza', messaggio: 'Indica il punto di partenza' },
        { campo: 'postiOfferti', messaggio: 'Numero di posti non valido' },
      ]),
    });
    mostraPagina();
    await completaModulo();
    fireEvent.click(screen.getByRole('button', { name: 'Pubblica un viaggio' }));

    await waitFor(() => {
      expect(screen.getByText('Indica il punto di partenza')).toBeInTheDocument();
      expect(screen.getByText('Numero di posti non valido')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Partenza da')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Posti offerti'))
      .toHaveAttribute('aria-invalid', 'true');
  });

  test('Pubblicazione: successo porta al dettaglio del viaggio creato', async () => {
    configuraApi({ viaggio: { id: 42 } });
    mostraPagina();
    await completaModulo();
    fireEvent.click(screen.getByRole('button', { name: 'Pubblica un viaggio' }));

    await waitFor(() =>
      expect(screen.getByTestId('percorso')).toHaveTextContent('/viaggi/42'),
    );
    expect(screen.getByText('Dettaglio del viaggio')).toBeInTheDocument();
  });
});
