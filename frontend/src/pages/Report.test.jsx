import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';

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
import Report from './Report.jsx';

function renderReport() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <Report />
      </MemoryRouter>
    </FluentProvider>,
  );
}

describe('Report', () => {
  beforeEach(() => {
    richiesta.mockReset();
    richiesta.mockImplementation((percorso) => {
      if (percorso === '/api/sedi') {
        return Promise.resolve([{ id: 1, nome: 'Campus di Fisciano' }]);
      }
      if (percorso === '/api/report?sedeId=1&dal=2026-10-01&al=2026-10-31') {
        return Promise.resolve({
          sede: { id: 1, nome: 'Campus di Fisciano' },
          dal: '2026-10-01',
          al: '2026-10-31',
          totali: { viaggiCondivisi: 3, postiOfferti: 9, passeggeriTrasportati: 3 },
          mesi: [{
            mese: '2026-10',
            viaggiCondivisi: 3,
            postiOfferti: 9,
            passeggeriTrasportati: 3,
          }],
          avviso: null,
        });
      }
      throw new Error(`Richiesta inattesa: ${percorso}`);
    });
  });

  test('Report: mostra i totali e la tabella mensile', async () => {
    renderReport();

    fireEvent.change(await screen.findByLabelText("Sede dell'organizzazione"), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Data di inizio'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('Data di fine'), {
      target: { value: '2026-10-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Genera report' }));

    expect(await screen.findByText('2026-10')).toBeInTheDocument();
    expect(screen.getByText('Report per mese')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /2026-10 3 9 3/ })).toBeInTheDocument();
    const totali = within(screen.getByRole('region', { name: 'Totali del report' }));
    expect(totali.getAllByText('3')).toHaveLength(2);
    expect(totali.getByText('9')).toBeInTheDocument();
    expect(richiesta).toHaveBeenCalledWith(
      '/api/report?sedeId=1&dal=2026-10-01&al=2026-10-31',
    );
  });
});
