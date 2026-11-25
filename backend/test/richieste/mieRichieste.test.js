const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { creaContesto, creaRichiesta, creaViaggio, pulisciContesto } = require('./fixture');

describe('Richieste di prenotazione: consultazione', () => {
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

  test('TC_TRIP_03.06 - Le mie richieste: stato e dati del viaggio', async () => {
    const stati = ['InAttesa', 'Accettata', 'Rifiutata', 'Annullata', 'Completata'];
    for (let indice = 0; indice < stati.length; indice += 1) {
      const viaggioId = await creaViaggio(contesto, {
        dataOraPartenza: `2026-12-${String(3 + indice).padStart(2, '0')}T08:00:00+01:00`,
        stato: stati[indice] === 'Completata' ? 'Concluso' : 'Attivo',
      });
      await creaRichiesta(viaggioId, contesto.passeggero.membroId, stati[indice]);
    }

    const risposta = await request(creaApp())
      .get('/api/richieste/mie')
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(200);
    expect(risposta.body.richieste.map(({ stato }) => stato)).toEqual([
      'Completata', 'Annullata', 'Rifiutata', 'Accettata', 'InAttesa',
    ]);
    expect(risposta.body.richieste[0]).toMatchObject({
      viaggio: {
        id: expect.any(Number),
        puntoPartenza: 'Salerno, Piazza della Concordia',
        sede: { id: contesto.sede.id, nome: contesto.sede.nome },
        conducente: { id: contesto.conducente.membroId },
      },
    });
  });
});
