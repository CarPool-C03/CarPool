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
    const concluso = await pubblica(contesto, datiViaggio(contesto.sede.id, {
      dataOraPartenza: '2026-12-04T08:00:00+01:00',
    }));
    await PersistenzaService.query(
      'UPDATE "Viaggio" SET stato = $1 WHERE id = $2',
      ['Concluso', concluso.body.id],
    );
    const passeggero = await aggiungiAccount(contesto);
    const altraPasseggera = await aggiungiAccount(contesto);
    await allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId);
    await allineaOrganizzazione(altraPasseggera, contesto.conducente.organizzazioneId);
    await PersistenzaService.query(
      `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
       VALUES ('InAttesa', $1, $2), ('Rifiutata', $3, $4)`,
      [passeggero.membroId, attivo.body.id, altraPasseggera.membroId, concluso.body.id],
    );

    const risposta = await request(creaApp())
      .get('/api/viaggi/miei')
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body.attivi.map((viaggio) => viaggio.id)).toEqual([attivo.body.id]);
    expect(risposta.body.conclusi.map((viaggio) => viaggio.id)).toEqual([concluso.body.id]);
    expect(risposta.body.attivi[0].richieste[0]).toMatchObject({
      stato: 'InAttesa',
      passeggero: { id: passeggero.membroId },
    });
    expect(risposta.body.conclusi[0].richieste[0].stato).toBe('Rifiutata');
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
