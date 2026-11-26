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
  fissaOrologio,
  pulisciContesto,
  ripristinaOrologio,
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
    fissaOrologio();
    contesto = await creaContesto();
    ConsoleEmailAdapter.emailInviate.length = 0;
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(async () => {
    try {
      if (contesto) await pulisciContesto(contesto);
    } finally {
      jest.restoreAllMocks();
      ripristinaOrologio();
    }
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
    expect(risposta.body.errore.messaggio).toMatch(/viaggio.*non.*attiv/i);
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
    expect(risposta.body.errore.messaggio).toMatch(/viaggio.*non.*attiv/i);
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
    expect(risposta.body.errore.messaggio).toMatch(/posti.{0,40}esaurit/i);
    expect(await statoRichiesta(richiestaId)).toBe('InAttesa');
    expect(richiesteAccettate.totale).toBe(3);
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(0);
  });

  test('Fixture richieste: il profilo del Conducente espone il veicolo a quattro posti', async () => {
    const membroId = contesto.conducente.membroId;
    const { organizzazioneId, organizzazioneCreataDaFixture, sede } = contesto;
    const accountIds = contesto.accounts.map(({ id }) => id);
    const membroIds = contesto.accounts.map(({ membroId: id }) => id);
    const profilo = await request(creaApp())
      .get('/api/profilo')
      .set('Cookie', contesto.cookieConducente);
    const [organizzazione] = await PersistenzaService.query(
      `SELECT o.denominazione, d.dominio FROM "Organizzazione" o
       JOIN "DominioEmail" d ON d."organizzazioneId" = o.id WHERE o.id = $1 AND d.dominio = $2`,
      [contesto.organizzazioneId, 'studenti.unisa.it'],
    );
    const membri = await PersistenzaService.query(
      `SELECT m.id, m.nome, m.cognome, m."organizzazioneId", a.email, a.stato
       FROM "Membro" m JOIN "Account" a ON a.id = m."accountId"
       WHERE m.id = ANY($1::integer[])`,
      [membroIds],
    );

    expect(profilo.status).toBe(200);
    expect(profilo.body.veicolo).toMatchObject({ modello: 'Fiat Panda', colore: 'Bianco', numeroPostiPasseggeri: 4 });
    expect(sede.nome).toBe('Campus di Fisciano');
    expect(organizzazione).toEqual({ denominazione: 'Università degli Studi di Salerno', dominio: 'studenti.unisa.it' });
    expect(membri).toHaveLength(3);
    expect(membri.map(({ id, nome, cognome }) => [id, nome, cognome])).toEqual(
      expect.arrayContaining([
        [contesto.conducente.membroId, 'Luca', 'Verdi'],
        [contesto.passeggero.membroId, 'Anna', 'Bianchi'],
        [contesto.altroPasseggero.membroId, 'Marco', 'Russo'],
      ]),
    );
    expect(membri.every(({ organizzazioneId, stato, email }) => (
      organizzazioneId === contesto.organizzazioneId
      && stato === 'Attivo' && email.endsWith('@studenti.unisa.it')
    ))).toBe(true);
    expect(new Set(membri.map(({ email }) => email)).size).toBe(3);

    await pulisciContesto(contesto);
    contesto = null;
    const residui = await PersistenzaService.query(
      `SELECT id FROM "Account" WHERE id = ANY($1::integer[])
       UNION ALL SELECT id FROM "Membro" WHERE id = ANY($2::integer[])
       UNION ALL SELECT id FROM "Veicolo" WHERE "membroId" = $3
       UNION ALL SELECT id FROM "Sede" WHERE id = $4
       UNION ALL SELECT id FROM "Organizzazione" WHERE id = $5 AND $6::boolean
       UNION ALL SELECT id FROM "DominioEmail" WHERE "organizzazioneId" = $5 AND $6::boolean`,
      [accountIds, membroIds, membroId, sede.id, organizzazioneId, organizzazioneCreataDaFixture],
    );
    expect(residui).toHaveLength(0);
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
