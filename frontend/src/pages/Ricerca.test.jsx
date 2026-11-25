import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes } from 'react-router';

vi.mock('../api/client.js', () => ({
  ErroreValidazione: class ErroreValidazione extends Error {
    constructor(errori) {
      super('Dati non validi');
      this.errori = errori;
    }
  },
  richiesta: vi.fn(),
}));

import { richiesta } from '../api/client.js';
import Ricerca from './Ricerca.jsx';

function mostraRicerca() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter
        initialEntries={[
          '/ricerca?zona=Salerno&sedeId=1&data=2026-12-03&orarioMinimo=08%3A00',
        ]}
      >
        <Routes>
          <Route path="/ricerca" element={<Ricerca />} />
        </Routes>
      </MemoryRouter>
    </FluentProvider>,
  );
}

describe('Ricerca', () => {
  beforeEach(() => {
    richiesta.mockReset();
    richiesta.mockImplementation((percorso) => {
      if (percorso === '/api/sedi') {
        return Promise.resolve([{ id: 1, nome: 'Campus di Fisciano' }]);
      }
      if (percorso.startsWith('/api/viaggi/ricerca?')) {
        return Promise.resolve({
          viaggi: [{
            id: 42,
            dataOraPartenza: '2026-12-03T08:00:00+01:00',
            puntoPartenza: 'Salerno, Piazza della Concordia',
            sede: { id: 1, nome: 'Campus di Fisciano' },
            postiOfferti: 3,
            postiDisponibili: 2,
            contributoIndicativoEuro: null,
            stato: 'Attivo',
            conducente: { id: 7, nome: 'Luca', cognome: 'Verdi' },
          }],
        });
      }
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
  });

  test('Ricerca: mostra Contributo non indicato quando manca', async () => {
    mostraRicerca();

    expect(await screen.findByText('Contributo non indicato')).toBeInTheDocument();
    expect(screen.getByText('Posti disponibili: 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dettaglio viaggio' })).toBeInTheDocument();
  });
});
