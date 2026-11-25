const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('Pubblicazione viaggio: precisione temporale', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  async function verificaIstantePubblicato(risposta, istanteAtteso) {
    expect(risposta.status).toBe(201);
    const [salvato] = await PersistenzaService.query(
      'SELECT "dataOraPartenza" FROM "Viaggio" WHERE id = $1',
      [risposta.body.id],
    );
    expect(new Date(salvato.dataOraPartenza).toISOString()).toBe(istanteAtteso);

    const letto = await request(creaApp())
      .get(`/api/viaggi/${risposta.body.id}`)
      .set('Cookie', contesto.cookie);
    expect(letto.status).toBe(200);
    expect(new Date(letto.body.dataOraPartenza).toISOString()).toBe(istanteAtteso);
  }

  test.each([
    ['secondi senza offset', '2026-12-03T08:00:17', '2026-12-03T07:00:17.000Z'],
    ['secondi e millisecondi senza offset', '2026-12-03T08:00:17.456', '2026-12-03T07:00:17.456Z'],
    ['secondi con offset', '2026-12-03T08:00:17+01:00', '2026-12-03T07:00:17.000Z'],
    ['secondi e millisecondi con offset', '2026-12-03T08:00:17.456+01:00', '2026-12-03T07:00:17.456Z'],
  ])(
    'Pubblicazione: conserva l’istante Europe/Rome con %s',
    async (_, dataOraPartenza, istanteAtteso) => {
      const risposta = await pubblica(
        contesto,
        datiViaggio(contesto.sede.id, { dataOraPartenza }),
      );

      await verificaIstantePubblicato(risposta, istanteAtteso);
    },
  );

  test.each([
    ['uguale al momento corrente', '2026-12-01T10:00:00'],
    ['precedente al momento corrente', '2026-12-01T09:59:59.999'],
  ])(
    'Pubblicazione: rifiuta l’istante %s e non registra il viaggio',
    async (_, dataOraPartenza) => {
      const risposta = await pubblica(
        contesto,
        datiViaggio(contesto.sede.id, { dataOraPartenza }),
      );

      expect(risposta.status).toBe(400);
      expect(risposta.body.errori).toContainEqual(
        expect.objectContaining({ campo: 'dataOraPartenza' }),
      );
      const viaggi = await PersistenzaService.query(
        'SELECT id FROM "Viaggio" WHERE "conducenteId" = $1',
        [contesto.conducente.membroId],
      );
      expect(viaggi).toHaveLength(0);
    },
  );

  test('Pubblicazione: accetta e conserva un istante futuro di 30 secondi', async () => {
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, {
        dataOraPartenza: '2026-12-01T10:00:30',
      }),
    );

    await verificaIstantePubblicato(risposta, '2026-12-01T09:00:30.000Z');
  });
});
