const { hrtime } = require('node:process');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  cerca,
  creaContestoRicerca,
  fissaOrologio,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('Prestazioni ricerca viaggi', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContestoRicerca();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('Ricerca: con 500 viaggi attivi risponde in meno di 2 secondi (RNF_PERF_3)', async () => {
    const viaggiCreati = await PersistenzaService.query(
      `INSERT INTO "Viaggio"
        ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
       SELECT TIMESTAMPTZ '2026-12-03 08:00:00+01' + (i * INTERVAL '1 minute'),
              'Salerno, Via di prova', 3, 'Attivo', $1, $2
       FROM generate_series(1, 500) AS i
       RETURNING id`,
      [contesto.conducente.membroId, contesto.sede.id],
    );
    contesto.viaggiId.push(...viaggiCreati.map(({ id }) => id));

    const inizio = hrtime.bigint();
    const risposta = await cerca(contesto);
    const durataMs = Number(hrtime.bigint() - inizio) / 1_000_000;

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi).toHaveLength(500);
    expect(durataMs).toBeLessThan(2000);
  });
});
