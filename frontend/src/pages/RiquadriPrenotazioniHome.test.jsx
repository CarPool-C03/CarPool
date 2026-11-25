import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';
import { UtenteProvider } from '../auth/UtenteContext.jsx';

vi.mock('../api/client.js', () => ({ richiesta: vi.fn() }));

import { richiesta } from '../api/client.js';
import RiquadriPrenotazioniHome from './RiquadriPrenotazioniHome.jsx';

afterEach(() => vi.clearAllMocks());

describe('Riquadri prenotazioni Home', () => {
  test('Home: mostra il prossimo viaggio Accettato e la richiesta In attesa più vicina', async () => {
    richiesta.mockResolvedValue({
      richieste: [
        {
          id: 2,
          stato: 'InAttesa',
          viaggio: {
            id: 2,
            dataOraPartenza: '2026-12-10T08:00:00+01:00',
            puntoPartenza: 'Avellino',
            sede: { nome: 'Campus' },
          },
        },
        {
          id: 1,
          stato: 'Accettata',
          viaggio: {
            id: 1,
            dataOraPartenza: '2026-12-03T08:00:00+01:00',
            puntoPartenza: 'Salerno',
            sede: { nome: 'Campus' },
            conducente: { nome: 'Luca', cognome: 'Verdi' },
          },
        },
      ],
    });
    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter>
          <UtenteProvider utenteIniziale={{ ruolo: 'Membro', membro: { id: 4 } }}>
            <RiquadriPrenotazioniHome />
          </UtenteProvider>
        </MemoryRouter>
      </FluentProvider>,
    );

    expect(await screen.findByText('Il tuo prossimo viaggio')).toBeInTheDocument();
    expect(screen.getByText('Salerno → Campus')).toBeInTheDocument();
    expect(screen.getByText('Avellino → Campus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Le mie prenotazioni' })).toBeInTheDocument();
  });
});
