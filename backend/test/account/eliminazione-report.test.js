const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  creaContestoReport,
  creaRichiesteCompletate,
  creaViaggio,
  pulisciContesto,
  report,
} = require('../report/fixture');
const { eliminaConCookie, login } = require('./fixture');

describe('Eliminazione account - report PSCL', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContestoReport();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
  });

  test('TC_AUTH_07.07 - Eliminazione: il report PSCL di un periodo passato non cambia', async () => {
    const viaggioId = await creaViaggio(contesto, {
      partenza: '2026-10-20T10:00:00+02:00',
      postiOfferti: 3,
    });
    await PersistenzaService.query(
      'UPDATE "Viaggio" SET stato = $1 WHERE id = $2',
      ['Concluso', viaggioId],
    );
    await creaRichiesteCompletate(contesto, viaggioId, 1);
    const prima = await report(contesto, contesto.sedeFisciano.id, '2026-10-01', '2026-10-31');

    const risposta = await eliminaConCookie(await login(contesto.conducente));
    const dopo = await report(contesto, contesto.sedeFisciano.id, '2026-10-01', '2026-10-31');
    expect(prima.status).toBe(200);
    expect(risposta.status).toBe(204);
    expect(dopo.body).toEqual(prima.body);
  });
});
