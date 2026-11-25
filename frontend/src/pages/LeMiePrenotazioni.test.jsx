import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import LeMiePrenotazioni from './LeMiePrenotazioni.jsx';

const richieste = [
  {
    id: 5,
    stato: 'InAttesa',
    viaggio: {
      id: 1,
      stato: 'Attivo',
      dataOraPartenza: '2026-12-03T08:00:00+01:00',
      puntoPartenza: 'Salerno',
      sede: { nome: 'Campus di Fisciano' },
      conducente: { nome: 'Luca', cognome: 'Verdi' },
    },
  },
  {
    id: 6,
    stato: 'Accettata',
    viaggio: {
      id: 2,
      stato: 'Attivo',
      dataOraPartenza: '2026-12-04T08:00:00+01:00',
      puntoPartenza: 'Baronissi',
      sede: { nome: 'Campus di Fisciano' },
      conducente: { nome: 'Anna', cognome: 'Bianchi' },
    },
  },
  {
    id: 7,
    stato: 'Completata',
    viaggio: {
      id: 3,
      stato: 'Concluso',
      dataOraPartenza: '2026-11-20T08:00:00+01:00',
      puntoPartenza: 'Salerno',
      sede: { nome: 'Campus di Fisciano' },
      conducente: { nome: 'Marco', cognome: 'Russo' },
    },
  },
];

function mostraPagina() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <LeMiePrenotazioni />
      </MemoryRouter>
    </FluentProvider>,
  );
}

afterEach(() => vi.clearAllMocks());

describe('Le mie prenotazioni', () => {
  test('TC_TRIP_03.10 - LeMiePrenotazioni: mostra lo stato e il pulsante Annulla', async () => {
    richiesta.mockImplementation((percorso, opzioni = {}) => (
      opzioni.metodo === 'POST'
        ? Promise.resolve({ id: 5, stato: 'Annullata' })
        : Promise.resolve({ richieste })
    ));
    mostraPagina();

    expect(await screen.findByText('In attesa')).toBeInTheDocument();
    expect(screen.getByText('Accettata')).toBeInTheDocument();
    expect(screen.getByText('Completata')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Annulla' })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'Annulla' })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Annulla' })).toHaveLength(1);
    });
    expect(richiesta).toHaveBeenCalledWith(
      '/api/richieste/5/annulla',
      { metodo: 'POST' },
    );
    expect(screen.getByText('Annullata')).toBeInTheDocument();
  });
});
