const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { creaContesto, creaRichiesta, creaViaggio, pulisciContesto } = require('./fixture');

describe('Richieste di prenotazione: annullamento', () => {
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

  test('TC_TRIP_03.07 - Annullamento: richiesta In attesa annullata senza cambiare i posti', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 2 });
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    const risposta = await request(creaApp())
      .post(`/api/richieste/${richiestaId}/annulla`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body.stato).toBe('Annullata');
    const viaggio = await request(creaApp())
      .get(`/api/viaggi/${viaggioId}`)
      .set('Cookie', contesto.cookie);
    expect(viaggio.body.postiDisponibili).toBe(2);
  });

  test('TC_TRIP_03.08 - Annullamento: richiesta Accettata annullata, posti disponibili aumentati di 1', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 1 });
    const richiestaId = await creaRichiesta(
      viaggioId,
      contesto.passeggero.membroId,
      'Accettata',
    );
    const risposta = await request(creaApp())
      .post(`/api/richieste/${richiestaId}/annulla`)
      .set('Cookie', contesto.cookie);
    const viaggio = await request(creaApp())
      .get(`/api/viaggi/${viaggioId}`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body.stato).toBe('Annullata');
    expect(viaggio.body.postiDisponibili).toBe(1);
  });

  test('TC_TRIP_03.09 - Annullamento: rifiutato per un viaggio Concluso', async () => {
    const viaggioId = await creaViaggio(contesto, { stato: 'Concluso' });
    const richiestaId = await creaRichiesta(
      viaggioId,
      contesto.passeggero.membroId,
      'InAttesa',
    );
    const risposta = await request(creaApp())
      .post(`/api/richieste/${richiestaId}/annulla`)
      .set('Cookie', contesto.cookie);
    const [persistita] = await PersistenzaService.query(
      'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
      [richiestaId],
    );

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_CONCLUSO');
    expect(persistita.stato).toBe('InAttesa');
  });

  test('TC_TRIP_03.11 - Annullamento: rifiutato se la richiesta appartiene a un altro Passeggero', async () => {
    const viaggioId = await creaViaggio(contesto);
    const richiestaId = await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    const risposta = await request(creaApp())
      .post(`/api/richieste/${richiestaId}/annulla`)
      .set('Cookie', contesto.cookieAltroPasseggero);

    expect(risposta.status).toBe(403);
    const [persistita] = await PersistenzaService.query(
      'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
      [richiestaId],
    );
    expect(persistita.stato).toBe('InAttesa');
  });

  test('TC_TRIP_03.12 - Annullamento: rifiutato per uno stato non annullabile', async () => {
    for (const stato of ['Rifiutata', 'Annullata', 'Completata']) {
      const viaggioId = await creaViaggio(contesto, {
        stato: stato === 'Completata' ? 'Concluso' : 'Attivo',
      });
      const richiestaId = await creaRichiesta(
        viaggioId,
        contesto.passeggero.membroId,
        stato,
      );
      const risposta = await request(creaApp())
        .post(`/api/richieste/${richiestaId}/annulla`)
        .set('Cookie', contesto.cookie);
      expect(risposta.status).toBe(409);
      expect(risposta.body.errore.codice).toBe('RICHIESTA_NON_ANNULLABILE');
    }
  });
});
