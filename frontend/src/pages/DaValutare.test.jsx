import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
import DaValutare from './DaValutare.jsx';
import ValutaPartecipante from './ValutaPartecipante.jsx';

const elenco = {
  daFare: [{
    viaggio: {
      id: 8,
      dataOraPartenza: '2026-12-03T08:00:00+01:00',
      sede: { id: 1, nome: 'Campus di Fisciano' },
    },
    persone: [
      { membroId: 5, nome: 'Anna', cognome: 'Bianchi', ruolo: 'Passeggero' },
    ],
  }],
};

function mostraPagine() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={['/valutazioni']}>
        <Routes>
          <Route path="/valutazioni" element={<DaValutare />} />
          <Route path="/valutazioni/:viaggioId" element={<ValutaPartecipante />} />
        </Routes>
      </MemoryRouter>
    </FluentProvider>,
  );
}

describe('DaValutare', () => {
  beforeEach(() => {
    richiesta.mockReset();
    richiesta.mockImplementation((percorso, opzioni) => {
      if (percorso === '/api/valutazioni/da-fare') return Promise.resolve(elenco);
      if (percorso === '/api/viaggi/8/valutazioni' && opzioni?.metodo === 'POST') {
        return Promise.resolve({ id: 12, punteggio: 4, commento: 'Puntuale', mediaValutato: 4 });
      }
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
  });

  test('DaValutare: invia punteggio e commento', async () => {
    mostraPagine();
    fireEvent.click(await screen.findByRole('button', { name: 'Valuta partecipanti' }));
    fireEvent.change(await screen.findByLabelText('Partecipante da valutare'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('Punteggio (1–5)'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Commento (facoltativo)'), {
      target: { value: 'Puntuale' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Invia valutazione' }));

    expect(await screen.findByText('Valutazione registrata')).toBeInTheDocument();
    expect(richiesta).toHaveBeenLastCalledWith('/api/viaggi/8/valutazioni', {
      metodo: 'POST',
      corpo: { valutatoId: 5, punteggio: 4, commento: 'Puntuale' },
    });
  });
});
