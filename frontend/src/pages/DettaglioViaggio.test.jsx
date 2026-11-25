import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, Route, Routes } from 'react-router';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import DettaglioViaggio from './DettaglioViaggio.jsx';

const viaggio = {
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

describe('Dettaglio viaggio', () => {
  beforeEach(() => {
    richiesta.mockReset().mockResolvedValue(viaggio);
  });

  test('Dettaglio: mostra i dati del viaggio in sola lettura', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter initialEntries={['/viaggi/42']}>
          <Routes>
            <Route path="/viaggi/:id" element={<DettaglioViaggio />} />
          </Routes>
        </MemoryRouter>
      </FluentProvider>,
    );

    expect(await screen.findByText((_, elemento) =>
      elemento?.tagName === 'SPAN'
      && elemento.textContent.includes('Salerno, Piazza della Concordia')
      && elemento.textContent.includes('Campus di Fisciano'),
    )).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dettaglio viaggio' }))
      .toBeInTheDocument();
    expect(screen.getByText(/Luca Verdi/)).toBeInTheDocument();
    expect(screen.getByText(/Contributo indicativo: 3,50/)).toBeInTheDocument();
    expect(screen.getByText('Attivo')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Richiedi posto/i }))
      .not.toBeInTheDocument();
  });
});
