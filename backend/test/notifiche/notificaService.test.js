const emailProviderOriginale = process.env.EMAIL_PROVIDER;
process.env.EMAIL_PROVIDER = 'console';

jest.mock('../../src/subsystems/logging/LogService', () => ({
  registraErrore: jest.fn(),
}));

const NotificaService = require('../../src/subsystems/notifiche/NotificaService');
const ConsoleEmailAdapter = require('../../src/subsystems/notifiche/ConsoleEmailAdapter');
const LogService = require('../../src/subsystems/logging/LogService');

const datiPrenotazione = {
  nomePasseggero: 'Anna Bianchi',
  nomeConducente: 'Luca Verdi',
  puntoPartenza: 'Campus di Fisciano',
  destinazione: 'Campus di Baronissi',
  dataOraPartenza: '2026-12-01T09:00:00.000Z',
};

beforeEach(() => {
  ConsoleEmailAdapter.emailInviate.length = 0;
  jest.clearAllMocks();
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  if (emailProviderOriginale === undefined) delete process.env.EMAIL_PROVIDER;
  else process.env.EMAIL_PROVIDER = emailProviderOriginale;
});

describe('NotificaService', () => {
  test('NotificaService: con EMAIL_PROVIDER=console inviaLinkVerifica registra destinatario e link', () => {
    const adapterInvia = jest.spyOn(ConsoleEmailAdapter.prototype, 'invia');
    const email = 'anna.bianchi@studenti.unisa.it';
    const link = 'https://carpool.example.test/verifica?token=abc123';

    expect(NotificaService.inviaLinkVerifica(email, link)).toBe(true);

    expect(ConsoleEmailAdapter.emailInviate[0]).toEqual({
      destinatario: email,
      tipo: 'verificaAccount',
      istante: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(adapterInvia.mock.calls[0][0].html).toContain(link);
  });

  test('NotificaService: inviaEsitoPrenotazione per esito accettato e rifiutato', () => {
    const adapterInvia = jest.spyOn(ConsoleEmailAdapter.prototype, 'invia');
    const email = 'anna.bianchi@studenti.unisa.it';

    expect(
      NotificaService.inviaEsitoPrenotazione(email, datiPrenotazione, 'Accettata'),
    ).toBe(true);
    expect(
      NotificaService.inviaEsitoPrenotazione(email, datiPrenotazione, 'Rifiutata'),
    ).toBe(true);

    const messaggi = adapterInvia.mock.calls.map(([messaggio]) => messaggio);
    expect(messaggi[0].oggetto).toBe('Richiesta di prenotazione accettata');
    expect(messaggi[1].oggetto).toBe('Richiesta di prenotazione rifiutata');
    expect(messaggi[0].html).toContain('Anna Bianchi');
    expect(messaggi[0].html).toContain('Luca Verdi');
    expect(messaggi[0].html).toContain('01/12/2026 10:00');
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(2);
  });

  test('NotificaService: se il provider fallisce l’errore va nel log e la chiamata non lancia', async () => {
    jest
      .spyOn(ConsoleEmailAdapter.prototype, 'invia')
      .mockRejectedValue(new Error('connessione fallita per anna.bianchi@studenti.unisa.it'));

    expect(() =>
      NotificaService.inviaEsitoPrenotazione('anna.bianchi@studenti.unisa.it', datiPrenotazione, 'Accettata'),
    ).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));

    expect(LogService.registraErrore).toHaveBeenCalledWith({
      codice: 'INVIO_EMAIL_FALLITO',
      descrizione: expect.stringContaining('[indirizzo omesso]'),
      sottosistema: 'notifiche',
    });
    expect(LogService.registraErrore.mock.calls[0][0].descrizione).not.toContain(
      'anna.bianchi@studenti.unisa.it',
    );
  });
});
