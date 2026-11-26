const { hrtime } = require('node:process');
const emailProviderOriginale = process.env.EMAIL_PROVIDER;
process.env.EMAIL_PROVIDER = 'console';

const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const ConsoleEmailAdapter = require('../../src/subsystems/notifiche/ConsoleEmailAdapter');
const NotificaService = require('../../src/subsystems/notifiche/NotificaService');
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

const statiAlMomentoDellaNotifica = [];
let istantiInvio;
eventi.registra({
  async aggiorna(evento) {
    const [richiesta] = await PersistenzaService.query(
      'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
      [evento.richiestaId],
    );
    statiAlMomentoDellaNotifica.push({
      tipo: evento.tipo,
      richiestaId: evento.richiestaId,
      stato: richiesta?.stato ?? null,
    });
  },
});

async function rispondi(azione, richiestaId, cookie) {
  return request(creaApp())
    .post(`/api/richieste/${richiestaId}/${azione}`)
    .set('Cookie', cookie);
}

async function cerca(contesto) {
  return request(creaApp())
    .get('/api/viaggi/ricerca')
    .query({
      zona: 'Salerno',
      sedeId: contesto.sede.id,
      data: '2026-12-03',
      orarioMinimo: '08:00',
    })
    .set('Cookie', contesto.cookie);
}

function verificaInvioEntro60Secondi(inizioOperazione) {
  expect(istantiInvio).toHaveLength(1);
  expect(istantiInvio[0] >= inizioOperazione).toBe(true);
  expect(istantiInvio[0] - inizioOperazione).toBeLessThan(60_000_000_000n);
}

function verificaNotificaDopoCommit(contesto, richiestaId, tipo, esito) {
  expect(NotificaService.inviaEsitoPrenotazione).toHaveBeenCalledWith(
    contesto.passeggero.email,
    expect.objectContaining({
      nomePasseggero: 'Anna Bianchi',
      nomeConducente: 'Luca Verdi',
    }),
    esito,
  );
  expect(statiAlMomentoDellaNotifica).toEqual([{ tipo, richiestaId, stato: esito }]);
}

describe('Esito delle risposte di prenotazione', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto();
    ConsoleEmailAdapter.emailInviate.length = 0;
    statiAlMomentoDellaNotifica.length = 0;
    istantiInvio = [];
    const inviaOriginale = ConsoleEmailAdapter.prototype.invia;
    jest.spyOn(ConsoleEmailAdapter.prototype, 'invia').mockImplementation(function (messaggio) {
      istantiInvio.push(hrtime.bigint());
      return inviaOriginale.call(this, messaggio);
    });
    jest.spyOn(NotificaService, 'inviaEsitoPrenotazione');
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

  test('TC_TRIP_06.04 - Risposta: accetta l’ultimo posto e rimuove il viaggio dalla ricerca', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 3 });
    const passeggeriAccettati = [
      await aggiungiPasseggero(contesto),
      await aggiungiPasseggero(contesto),
    ];
    for (const passeggero of passeggeriAccettati) {
      await creaRichiesta(viaggioId, passeggero.membroId, 'Accettata');
    }
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);

    const inizioOperazione = hrtime.bigint();
    const risposta = await rispondi('accetta', richiestaId, contesto.cookieConducente);
    const risultati = await cerca(contesto);
    const [email] = ConsoleEmailAdapter.emailInviate;

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({ id: richiestaId, stato: 'Accettata', postiDisponibili: 0 });
    expect(risultati.body.viaggi).not.toContainEqual(
      expect.objectContaining({ id: viaggioId }),
    );
    expect(email).toEqual(expect.objectContaining({
      destinatario: contesto.passeggero.email,
      tipo: 'esitoPrenotazione',
    }));
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(1);
    verificaNotificaDopoCommit(
      contesto,
      richiestaId,
      'RichiestaAccettata',
      'Accettata',
    );
    verificaInvioEntro60Secondi(inizioOperazione);
  });

  test('TC_TRIP_06.05 - Risposta: accettazione riduce di uno i posti disponibili', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 3 });
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);

    const inizioOperazione = hrtime.bigint();
    const risposta = await rispondi('accetta', richiestaId, contesto.cookieConducente);
    const risultati = await cerca(contesto);
    const [email] = ConsoleEmailAdapter.emailInviate;

    expect(risposta.status).toBe(200);
    expect(risposta.body.stato).toBe('Accettata');
    expect(risposta.body.postiDisponibili).toBe(2);
    expect(risultati.body.viaggi).toContainEqual(
      expect.objectContaining({ id: viaggioId, postiDisponibili: 2 }),
    );
    expect(email.destinatario).toBe(contesto.passeggero.email);
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(1);
    verificaNotificaDopoCommit(
      contesto,
      richiestaId,
      'RichiestaAccettata',
      'Accettata',
    );
    verificaInvioEntro60Secondi(inizioOperazione);
  });

  test('TC_TRIP_06.06 - Risposta: rifiuto non modifica i posti e notifica il Passeggero', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 3 });
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);

    const inizioOperazione = hrtime.bigint();
    const risposta = await rispondi('rifiuta', richiestaId, contesto.cookieConducente);
    const viaggio = await request(creaApp())
      .get(`/api/viaggi/${viaggioId}`)
      .set('Cookie', contesto.cookie);
    const [email] = ConsoleEmailAdapter.emailInviate;

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({ id: richiestaId, stato: 'Rifiutata' });
    expect(viaggio.body.postiDisponibili).toBe(3);
    expect(email.destinatario).toBe(contesto.passeggero.email);
    expect(ConsoleEmailAdapter.emailInviate).toHaveLength(1);
    verificaNotificaDopoCommit(
      contesto,
      richiestaId,
      'RichiestaRifiutata',
      'Rifiutata',
    );
    verificaInvioEntro60Secondi(inizioOperazione);
  });
});
