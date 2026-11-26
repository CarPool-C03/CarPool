const emailProviderOriginale = process.env.EMAIL_PROVIDER;
process.env.EMAIL_PROVIDER = 'console';

const NotificaService = require('../../src/subsystems/notifiche/NotificaService');
const ConsoleEmailAdapter = require('../../src/subsystems/notifiche/ConsoleEmailAdapter');

const email = 'anna.bianchi@example.test';
const dati = {
  nomePasseggero: 'Anna Bianchi',
  nomeConducente: 'Luca Verdi',
  puntoPartenza: 'Salerno',
  destinazione: 'Campus',
  dataOraPartenza: '2026-12-03T08:00:00+01:00',
};

beforeEach(() => {
  ConsoleEmailAdapter.emailInviate.length = 0;
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

afterAll(() => {
  if (emailProviderOriginale === undefined) delete process.env.EMAIL_PROVIDER;
  else process.env.EMAIL_PROVIDER = emailProviderOriginale;
});

test('NotificaService: modifica e cancellazione inviano i dati aggiornati del viaggio', () => {
  const invia = jest.spyOn(ConsoleEmailAdapter.prototype, 'invia');

  expect(NotificaService.inviaNotificaModifica(email, dati)).toBe(true);
  expect(NotificaService.inviaNotificaCancellazione(email, dati)).toBe(true);

  expect(invia.mock.calls.map(([messaggio]) => messaggio.oggetto)).toEqual([
    'Viaggio modificato',
    'Viaggio cancellato',
  ]);
  expect(ConsoleEmailAdapter.emailInviate.map(({ tipo }) => tipo)).toEqual([
    'modificaViaggio',
    'cancellazioneViaggio',
  ]);
  expect(invia.mock.calls[0][0].html).toContain('03/12/2026 08:00');
  expect(invia.mock.calls[0][0].html).toContain('Anna Bianchi');
  expect(ConsoleEmailAdapter.emailInviate).toHaveLength(2);
});
