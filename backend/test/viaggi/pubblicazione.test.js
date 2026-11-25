const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiVeicolo,
  contaViaggi,
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('Pubblicazione viaggio: validazione', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  async function verificaRifiuto(risposta, campo) {
    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo }));
    expect(await contaViaggi(contesto.conducente.membroId)).toBe(0);
  }

  test('TC_TRIP_01.01 - senza veicolo: pubblicazione impedita prima dei dati', async () => {
    const risposta = await request(creaApp())
      .get('/api/viaggi/pubblicazione')
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VEICOLO_ASSENTE');
    expect(await contaViaggi(contesto.conducente.membroId)).toBe(0);
  });

  test('TC_TRIP_01.02 - punto di partenza mancante: segnala il campo e non registra', async () => {
    await aggiungiVeicolo(contesto);
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { puntoPartenza: '' }),
    );

    await verificaRifiuto(risposta, 'puntoPartenza');
  });

  test('TC_TRIP_01.03 - partenza coincidente col presente: errore data e ora', async () => {
    await aggiungiVeicolo(contesto);
    const risposta = await pubblica(contesto, datiViaggio(contesto.sede.id, {
      dataOraPartenza: '2026-12-01T10:00:00+01:00',
    }));

    await verificaRifiuto(risposta, 'dataOraPartenza');
  });

  test('TC_TRIP_01.04 - partenza trascorsa: errore data e ora', async () => {
    await aggiungiVeicolo(contesto);
    const risposta = await pubblica(contesto, datiViaggio(contesto.sede.id, {
      dataOraPartenza: '2026-12-01T09:00:00+01:00',
    }));

    await verificaRifiuto(risposta, 'dataOraPartenza');
  });

  test('TC_TRIP_01.05 - posti superiori alla capacita: errore e nessuna registrazione', async () => {
    await aggiungiVeicolo(contesto);
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { postiOfferti: 5 }),
    );

    await verificaRifiuto(risposta, 'postiOfferti');
  });

  test('TC_TRIP_01.06 - zero posti: errore e nessuna registrazione', async () => {
    await aggiungiVeicolo(contesto);
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { postiOfferti: 0 }),
    );

    await verificaRifiuto(risposta, 'postiOfferti');
  });
});
