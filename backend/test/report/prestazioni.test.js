const { hrtime } = require('node:process');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  creaContestoReport,
  fissaOrologio,
  pulisciContesto,
  report,
  ripristinaOrologio,
} = require('./fixture');

describe('Prestazioni report PSCL', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContestoReport();
  });

  afterEach(async () => {
    if (contesto) await pulisciContesto(contesto);
    contesto = null;
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('TC_ORG_01.07 - report di 12 mesi in meno di 10 secondi', async () => {
    await PersistenzaService.query(
      `INSERT INTO "Viaggio"
        ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
       SELECT TIMESTAMPTZ '2025-12-01 10:00:00+01' + ((i - 1) % 365) * INTERVAL '1 day',
              'Salerno, Via di prova', 3, 'Concluso', $1, $2
       FROM generate_series(1, 10000) AS i`,
      [contesto.conducente.membroId, contesto.sedeFisciano.id],
    );

    const inizio = hrtime.bigint();
    const risposta = await report(
      contesto,
      contesto.sedeFisciano.id,
      '2025-12-01',
      '2026-11-30',
    );
    const durataMs = Number(hrtime.bigint() - inizio) / 1_000_000;

    expect(risposta.status).toBe(200);
    expect(risposta.body.totali.viaggiCondivisi).toBe(10000);
    expect(Object.keys(risposta.body).sort()).toEqual(['al', 'avviso', 'dal', 'mesi', 'sede', 'totali']);
    expect(durataMs).toBeLessThan(10000);
  });
});
