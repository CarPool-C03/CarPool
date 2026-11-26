const emailProviderOriginale = process.env.EMAIL_PROVIDER;
process.env.EMAIL_PROVIDER = 'console';

const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const LogService = require('../../src/subsystems/logging/LogService');
const ConsoleEmailAdapter = require('../../src/subsystems/notifiche/ConsoleEmailAdapter');
const NotificaEsitoObserver = require('../../src/subsystems/viaggiPrenotazioni/eventi/NotificaEsitoObserver');
const { eventi } = require('../../src/subsystems/viaggiPrenotazioni/eventi');
const {
  aggiungiPasseggero,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  pulisciContesto,
} = require('./fixture');

eventi.registra(new NotificaEsitoObserver());

async function rispondi(azione, richiestaId, cookie) {
  return request(creaApp())
    .post(`/api/richieste/${richiestaId}/${azione}`)
    .set('Cookie', cookie);
}

async function statoRichiesta(richiestaId) {
  const [richiesta] = await PersistenzaService.query(
    'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
    [richiestaId],
  );
  return richiesta.stato;
}

describe('Risposta alle richieste di prenotazione', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContesto();
    ConsoleEmailAdapter.emailInviate.length = 0;
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
    if (emailProviderOriginale === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = emailProviderOriginale;
  });

  test('TC_TRIP_06.01 - Risposta: accettazione rifiutata se il viaggio è Cancellato', async () => {
    const viaggioId = await creaViaggio(contesto, { stato: 'Cancellato' });
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    const risposta = await rispondi('accetta', richiestaId, contesto.cookieConducente);

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_NON_ATTIVO');
    expect(risposta.body.errore.messaggio).toEqual(expect.any(String));
    expect(risposta.body.errore.messaggio.trim()).not.toBe('');
    expect(await statoRichiesta(richiestaId)).toBe('InAttesa');
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(0);
  });

  test('TC_TRIP_06.02 - Risposta: rifiuto rifiutato se il viaggio è Concluso', async () => {
    const viaggioId = await creaViaggio(contesto, { stato: 'Concluso' });
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    const risposta = await rispondi('rifiuta', richiestaId, contesto.cookieConducente);

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_NON_ATTIVO');
    expect(risposta.body.errore.messaggio).toEqual(expect.any(String));
    expect(risposta.body.errore.messaggio.trim()).not.toBe('');
    expect(await statoRichiesta(richiestaId)).toBe('InAttesa');
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(0);
  });

  test('TC_TRIP_06.03 - Risposta: richiesta in attesa se i posti sono esauriti', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 3 });
    const passeggeri = [
      await aggiungiPasseggero(contesto),
      await aggiungiPasseggero(contesto),
      await aggiungiPasseggero(contesto),
    ];
    for (const passeggero of passeggeri) {
      await creaRichiesta(viaggioId, passeggero.membroId, 'Accettata');
    }
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    const risposta = await rispondi('accetta', richiestaId, contesto.cookieConducente);
    const [richiesteAccettate] = await PersistenzaService.query(
      `SELECT COUNT(*)::integer AS totale
       FROM "RichiestaPrenotazione"
       WHERE "viaggioId" = $1 AND stato = 'Accettata'`,
      [viaggioId],
    );

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('POSTI_ESAURITI');
    expect(risposta.body.errore.messaggio).toEqual(expect.any(String));
    expect(risposta.body.errore.messaggio.trim()).not.toBe('');
    expect(await statoRichiesta(richiestaId)).toBe('InAttesa');
    expect(richiesteAccettate.totale).toBe(3);
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(0);
  });

  test('Notifica: se l’invio fallisce l’accettazione resta valida e l’errore è nel log', async () => {
    const viaggioId = await creaViaggio(contesto);
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    jest.spyOn(ConsoleEmailAdapter.prototype, 'invia')
      .mockRejectedValue(new Error('provider non disponibile'));
    const registraErrore = jest.spyOn(LogService, 'registraErrore').mockImplementation(() => {});

    const risposta = await rispondi('accetta', richiestaId, contesto.cookieConducente);
    await new Promise((resolve) => setImmediate(resolve));

    expect(risposta.status).toBe(200);
    expect(await statoRichiesta(richiestaId)).toBe('Accettata');
    expect(registraErrore).toHaveBeenCalledWith(expect.objectContaining({
      codice: 'INVIO_EMAIL_FALLITO',
      sottosistema: 'notifiche',
    }));
  });

  test('Risposta: un utente diverso dal Conducente riceve 403', async () => {
    const viaggioId = await creaViaggio(contesto);
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);

    for (const azione of ['accetta', 'rifiuta']) {
      const risposta = await rispondi(azione, richiestaId, contesto.cookieAltroPasseggero);
      expect(risposta.status).toBe(403);
      expect(await statoRichiesta(richiestaId)).toBe('InAttesa');
    }
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(0);
  });
});
