const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  creaContesto,
  creaRichiesta,
  creaViaggio,
  pulisciContesto,
} = require('./fixture');

describe('Richieste di prenotazione: creazione', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContesto();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('TC_TRIP_03.01 - Richiesta: crea una richiesta In attesa', async () => {
    const viaggioId = await creaViaggio(contesto);
    const risposta = await request(creaApp())
      .post(`/api/viaggi/${viaggioId}/richieste`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(201);
    expect(risposta.body).toMatchObject({
      stato: 'InAttesa',
      viaggio: { id: viaggioId, stato: 'Attivo' },
    });
  });

  test('TC_TRIP_03.02 - Richiesta: accettata in attesa anche senza posti disponibili', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 1 });
    await creaRichiesta(viaggioId, contesto.altroPasseggero.membroId, 'Accettata');
    const risposta = await request(creaApp())
      .post(`/api/viaggi/${viaggioId}/richieste`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(201);
    expect(risposta.body.stato).toBe('InAttesa');
  });

  test('TC_TRIP_03.03 - Richiesta: rifiutata sul proprio viaggio', async () => {
    const viaggioId = await creaViaggio(contesto, {
      conducenteId: contesto.passeggero.membroId,
    });
    const risposta = await request(creaApp())
      .post(`/api/viaggi/${viaggioId}/richieste`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_PROPRIO');
  });

  test('TC_TRIP_03.04 - Richiesta: rifiutata per un viaggio non Attivo', async () => {
    for (const stato of ['Cancellato', 'Concluso']) {
      const viaggioId = await creaViaggio(contesto, { stato });
      const risposta = await request(creaApp())
        .post(`/api/viaggi/${viaggioId}/richieste`)
        .set('Cookie', contesto.cookie);
      expect(risposta.status).toBe(409);
      expect(risposta.body.errore.codice).toBe('VIAGGIO_NON_ATTIVO');
    }
  });

  test('TC_TRIP_03.05 - Richiesta: una seconda richiesta attiva per lo stesso viaggio è rifiutata', async () => {
    for (const stato of ['InAttesa', 'Accettata']) {
      const viaggioId = await creaViaggio(contesto);
      await creaRichiesta(viaggioId, contesto.passeggero.membroId, stato);
      const risposta = await request(creaApp())
        .post(`/api/viaggi/${viaggioId}/richieste`)
        .set('Cookie', contesto.cookie);
      expect(risposta.status).toBe(409);
      expect(risposta.body.errore.codice).toBe('RICHIESTA_GIA_PRESENTE');
    }
  });

  test('Dettaglio viaggio: mostra il viaggio ai membri della stessa organizzazione', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 2 });
    const risposta = await request(creaApp())
      .get(`/api/viaggi/${viaggioId}`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toMatchObject({
      id: viaggioId,
      postiOfferti: 2,
      postiDisponibili: 2,
      conducente: { id: contesto.conducente.membroId },
    });
  });
});
