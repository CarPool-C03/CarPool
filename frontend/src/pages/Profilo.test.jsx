import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter, useLocation } from 'react-router';
import Profilo from './Profilo.jsx';

function risposta(status, dati) {
  return { ok: status < 400, status, json: () => Promise.resolve(dati) };
}

function mostraProfilo(percorso = '/profilo/veicolo') {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter initialEntries={[percorso]}>
        <Profilo />
        <PercorsoCorrente />
      </MemoryRouter>
    </FluentProvider>,
  );
}

function PercorsoCorrente() {
  return <output data-testid="percorso">{useLocation().pathname}</output>;
}

function datiProfilo() {
  return {
    nome: 'Luca',
    cognome: 'Verdi',
    email: 'luca@example.test',
    organizzazione: { id: 1, denominazione: 'Università di prova' },
    ruoloMobilityManager: false,
    veicolo: null,
    valutazioneMedia: null,
  };
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

  test('Profilo: conferma eliminazione spiega gli effetti e può essere annullata', async () => {
    const fetch = vi.fn().mockResolvedValue(risposta(200, datiProfilo()));
    vi.stubGlobal('fetch', fetch);
    mostraProfilo('/profilo');

    fireEvent.click(await screen.findByRole('button', { name: 'Elimina il mio account' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('profilo saranno anonimizzati');
    expect(screen.getByRole('dialog')).toHaveTextContent('viaggi attivi saranno cancellati');
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('Profilo: conferma eliminazione invia la password e torna alla pagina iniziale', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(risposta(200, datiProfilo()))
      .mockResolvedValueOnce(risposta(204));
    vi.stubGlobal('fetch', fetch);
    mostraProfilo('/profilo');

    fireEvent.click(await screen.findByRole('button', { name: 'Elimina il mio account' }));
    fireEvent.change(await screen.findByLabelText('Password'), {
      target: { value: 'Password-di-test-47!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Conferma eliminazione' }));

    await waitFor(() => expect(screen.getByTestId('percorso')).toHaveTextContent('/'));
    expect(fetch).toHaveBeenCalledWith('/api/account', expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ password: 'Password-di-test-47!' }),
    }));
  });
});
