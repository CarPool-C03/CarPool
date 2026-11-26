const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiAccount,
  allineaOrganizzazione,
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('I miei viaggi', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  test('TC_TRIP_04.01 - I miei viaggi: restituisce viaggi attivi e conclusi con le richieste', async () => {
    const attivo = await pubblica(contesto, datiViaggio(contesto.sede.id));
    const altroAttivo = await pubblica(contesto, datiViaggio(contesto.sede.id, {
      dataOraPartenza: '2026-12-03T09:00:00+01:00',
    }));
    const concluso = await pubblica(contesto, datiViaggio(contesto.sede.id, {
      dataOraPartenza: '2026-12-04T08:00:00+01:00',
    }));
    const altroConcluso = await pubblica(contesto, datiViaggio(contesto.sede.id, {
      dataOraPartenza: '2026-12-05T08:00:00+01:00',
    }));
    await PersistenzaService.query(
      'UPDATE "Viaggio" SET stato = $1 WHERE id = ANY($2::integer[])',
      ['Concluso', [concluso.body.id, altroConcluso.body.id]],
    );
    const passeggeri = await Promise.all([
      aggiungiAccount(contesto),
      aggiungiAccount(contesto),
      aggiungiAccount(contesto),
      aggiungiAccount(contesto),
    ]);
    await Promise.all(passeggeri.map((passeggero) =>
      allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId)));
    const richieste = [
      [passeggeri[0], attivo.body.id, 'InAttesa'],
      [passeggeri[1], altroAttivo.body.id, 'Accettata'],
      [passeggeri[2], concluso.body.id, 'Rifiutata'],
      [passeggeri[3], altroConcluso.body.id, 'Annullata'],
    ];
    for (const [passeggero, viaggioId, stato] of richieste) {
      await PersistenzaService.query(
        `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
         VALUES ($1, $2, $3)`,
        [stato, passeggero.membroId, viaggioId],
      );
    }

    const risposta = await request(creaApp())
      .get('/api/viaggi/miei')
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body.attivi.map((viaggio) => viaggio.id)).toEqual([
      attivo.body.id,
      altroAttivo.body.id,
    ]);
    expect(risposta.body.conclusi.map((viaggio) => viaggio.id)).toEqual([
      altroConcluso.body.id,
      concluso.body.id,
    ]);
    expect(risposta.body.attivi.map((viaggio) => viaggio.richieste[0])).toMatchObject([
      {
        stato: 'InAttesa',
        passeggero: {
          id: passeggeri[0].membroId,
          nome: 'Utente',
          cognome: 'Test',
        },
      },
      {
        stato: 'Accettata',
        passeggero: {
          id: passeggeri[1].membroId,
          nome: 'Utente',
          cognome: 'Test',
        },
      },
    ]);
    expect(risposta.body.conclusi.map((viaggio) => viaggio.richieste[0])).toMatchObject([
      {
        stato: 'Annullata',
        passeggero: { id: passeggeri[3].membroId },
      },
      {
        stato: 'Rifiutata',
        passeggero: { id: passeggeri[2].membroId },
      },
    ]);
  });

  test('TC_TRIP_04.02 - I miei viaggi: esclude i viaggi cancellati', async () => {
    const viaggio = await pubblica(contesto, datiViaggio(contesto.sede.id));
    await PersistenzaService.query(
      'UPDATE "Viaggio" SET stato = $1 WHERE id = $2',
      ['Cancellato', viaggio.body.id],
    );

    const risposta = await request(creaApp())
      .get('/api/viaggi/miei')
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({ attivi: [], conclusi: [] });
  });

  test('TC_TRIP_04.03 - I miei viaggi: restituisce elenchi vuoti senza viaggi', async () => {
    const risposta = await request(creaApp())
      .get('/api/viaggi/miei')
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({ attivi: [], conclusi: [] });
  });
});
