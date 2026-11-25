import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';
import Profilo from './Profilo.jsx';

function risposta(status, dati) {
  return { ok: status < 400, status, json: () => Promise.resolve(dati) };
}

function mostraProfilo(percorso = '/profilo/veicolo') {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={[percorso]}>
        <Profilo />
      </MemoryRouter>
    </FluentProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Profilo', () => {
  test('Profilo: mostra l’errore sotto il campo dei posti', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(risposta(200, {
          nome: 'Luca',
          cognome: 'Verdi',
          email: 'luca@example.test',
          organizzazione: { id: 1, denominazione: 'Università di prova' },
          ruoloMobilityManager: false,
          veicolo: null,
          valutazioneMedia: null,
        }))
        .mockResolvedValueOnce(risposta(400, {
          errori: [{
            campo: 'numeroPostiPasseggeri',
            messaggio: 'Inserisci almeno un posto passeggeri',
          }],
        })),
    );
    mostraProfilo();

    const posti = await screen.findByLabelText('Posti passeggeri');
    fireEvent.change(posti, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva veicolo' }));

    expect(await screen.findByText('Inserisci almeno un posto passeggeri')).toBeInTheDocument();
    expect(posti).toHaveAttribute('aria-invalid', 'true');
  });

  test('Profilo: mostra i dati personali in sola lettura', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(risposta(200, {
        nome: 'Luca',
        cognome: 'Verdi',
        email: 'luca@example.test',
        organizzazione: { id: 1, denominazione: 'Università di prova' },
        ruoloMobilityManager: false,
        veicolo: null,
        valutazioneMedia: null,
      })),
    );
    mostraProfilo('/profilo');

    expect(await screen.findByText('luca@example.test')).toBeInTheDocument();
    expect(screen.getByText('Università di prova')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Nome' })).not.toBeInTheDocument();
  });

  test('Profilo: veicolo registrato mostrato in sola lettura', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(risposta(200, {
        nome: 'Luca',
        cognome: 'Verdi',
        email: 'luca@example.test',
        organizzazione: { id: 1, denominazione: 'Università di prova' },
        ruoloMobilityManager: false,
        veicolo: {
          id: 3,
          modello: 'Fiat Panda',
          colore: 'Bianco',
          numeroPostiPasseggeri: 4,
        },
        valutazioneMedia: null,
      })),
    );
    mostraProfilo();

    expect(await screen.findByText('Fiat Panda')).toBeInTheDocument();
    expect(screen.getByText('Bianco')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salva veicolo' })).not.toBeInTheDocument();
  });
});
