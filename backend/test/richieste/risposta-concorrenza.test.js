const emailProviderOriginale = process.env.EMAIL_PROVIDER;
process.env.EMAIL_PROVIDER = 'console';

const { Pool } = require('pg');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
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

const connectOriginale = Pool.prototype.connect;

eventi.registra(new NotificaEsitoObserver());

describe('Risposte concorrenti alle richieste di prenotazione', () => {
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

  test('TC_TRIP_06.07 - Risposta: due accettazioni concorrenti non superano i posti offerti', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 3 });
    const passeggeriAccettati = [
      await aggiungiPasseggero(contesto),
      await aggiungiPasseggero(contesto),
    ];
    for (const passeggero of passeggeriAccettati) {
      await creaRichiesta(viaggioId, passeggero.membroId, 'Accettata');
    }
    const richiesta1 = await creaRichiesta(
      viaggioId,
      contesto.passeggero.membroId,
    );
    const richiesta2 = await creaRichiesta(
      viaggioId,
      contesto.altroPasseggero.membroId,
    );
    const backendPids = [];
    let arrivi = 0;
    let timeout;
    let rilasciaBarriera;
    let rifiutaBarriera;
    const barriera = new Promise((resolve, reject) => {
      rilasciaBarriera = resolve;
      rifiutaBarriera = reject;
    });
    const connectSpy = jest.spyOn(Pool.prototype, 'connect').mockImplementation(function (...args) {
      const connessione = connectOriginale.apply(this, args);
      if (args.length > 0) return connessione;

      return connessione.then((client) => {
        const queryOriginale = client.query.bind(client);
        client.query = async (sql, ...parametri) => {
          if (sql === 'BEGIN') {
            try {
              const { rows: [riga] } = await queryOriginale(
                'SELECT pg_backend_pid() AS pid',
              );
              backendPids.push(Number(riga.pid));
              arrivi += 1;
              if (arrivi === 1) {
                timeout = setTimeout(
                  () => rifiutaBarriera(new Error('La seconda transazione non è arrivata')),
                  10_000,
                );
              } else if (arrivi === 2) {
                clearTimeout(timeout);
                rilasciaBarriera();
              }
              await barriera;
              return await queryOriginale(sql, ...parametri);
            } finally {
              client.query = queryOriginale;
            }
          }
          return queryOriginale(sql, ...parametri);
        };
        return client;
      });
    });
    let risposte;
    try {
      risposte = await Promise.all([richiesta1, richiesta2].map((id) => (
        request(creaApp())
          .post(`/api/richieste/${id}/accetta`)
          .set('Cookie', contesto.cookieConducente)
      )));
    } finally {
      clearTimeout(timeout);
      connectSpy.mockRestore();
    }
    const [richiestePersistite] = await PersistenzaService.query(
      `SELECT COUNT(*)::integer AS totale
       FROM "RichiestaPrenotazione"
       WHERE "viaggioId" = $1 AND stato = 'Accettata'`,
      [viaggioId],
    );
    const [richiesteInAttesa] = await PersistenzaService.query(
      `SELECT COUNT(*)::integer AS totale
       FROM "RichiestaPrenotazione"
       WHERE "viaggioId" = $1 AND stato = 'InAttesa'`,
      [viaggioId],
    );
    const statiRisposte = await PersistenzaService.query(
      `SELECT id, stato FROM "RichiestaPrenotazione"
       WHERE id = ANY($1::integer[]) ORDER BY id`,
      [[richiesta1, richiesta2]],
    );

    expect(risposte.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(backendPids).toHaveLength(2);
    expect(new Set(backendPids).size).toBe(2);
    expect(richiestePersistite.totale).toBe(3);
    expect(richiesteInAttesa.totale).toBe(1);
    expect(statiRisposte.filter(({ stato }) => stato === 'Accettata')).toHaveLength(1);
    expect(statiRisposte.filter(({ stato }) => stato === 'InAttesa')).toHaveLength(1);
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(1);
  }, 15_000);
});
