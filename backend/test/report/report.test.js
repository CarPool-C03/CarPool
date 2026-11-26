const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiSedeAltraOrganizzazione,
  creaContestoReport,
  creaRichiesteCompletate,
  creaViaggio,
  fissaOrologio,
  pulisciContesto,
  report,
  ripristinaOrologio,
} = require('./fixture');

describe('Report PSCL', () => {
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

  test('TC_ORG_01.01 - date uguali: errore sulle date', async () => {
    const risposta = await report(contesto, contesto.sedeFisciano.id, '2026-10-15', '2026-10-15');

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'dal' }));
  });

  test('TC_ORG_01.02 - inizio successivo alla fine: errore sulle date', async () => {
    const risposta = await report(contesto, contesto.sedeFisciano.id, '2026-10-31', '2026-10-01');

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'dal' }));
  });

  test('TC_ORG_01.03 - periodo futuro: errore sulle date', async () => {
    const risposta = await report(contesto, contesto.sedeFisciano.id, '2027-01-01', '2027-01-31');

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'al' }));
  });

  test('TC_ORG_01.04 - nessun viaggio: valori a zero e avviso', async () => {
    const risposta = await report(contesto, contesto.sedeFisciano.id, '2026-08-01', '2026-08-31');

    expect(risposta.status).toBe(200);
    expect(risposta.body).toMatchObject({
      totali: { viaggiCondivisi: 0, postiOfferti: 0, passeggeriTrasportati: 0 },
      mesi: [],
      avviso: 'Nel periodo non risultano viaggi condivisi per la sede indicata',
    });
  });

  test('TC_ORG_01.05 - un viaggio: conteggi anonimi corretti', async () => {
    const viaggioId = await creaViaggio(contesto, {
      partenza: '2026-10-05T08:00:00+02:00',
      postiOfferti: 4,
    });
    await creaRichiesteCompletate(contesto, viaggioId, 2);

    const risposta = await report(contesto, contesto.sedeFisciano.id, '2026-10-01', '2026-10-31');

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({
      sede: { id: contesto.sedeFisciano.id, nome: 'Campus di Fisciano' },
      dal: '2026-10-01',
      al: '2026-10-31',
      totali: { viaggiCondivisi: 1, postiOfferti: 4, passeggeriTrasportati: 2 },
      mesi: [{
        mese: '2026-10',
        viaggiCondivisi: 1,
        postiOfferti: 4,
        passeggeriTrasportati: 2,
      }],
      avviso: null,
    });
  });

  test('TC_ORG_01.06 - più viaggi: aggrega solo sede e periodo', async () => {
    const viaggioA = await creaViaggio(contesto, {
      partenza: '2026-10-05T08:00:00+02:00',
      postiOfferti: 4,
    });
    const viaggioB = await creaViaggio(contesto, {
      partenza: '2026-10-12T08:00:00+02:00',
      postiOfferti: 3,
    });
    await creaViaggio(contesto, {
      partenza: '2026-10-19T08:00:00+02:00',
      postiOfferti: 2,
    });
    await creaViaggio(contesto, {
      partenza: '2026-09-15T08:00:00+02:00',
      postiOfferti: 6,
    });
    await creaViaggio(contesto, {
      sede: contesto.sedeBaronissi,
      partenza: '2026-10-10T08:00:00+02:00',
      postiOfferti: 5,
    });
    await creaRichiesteCompletate(contesto, viaggioA, 2);
    await creaRichiesteCompletate(contesto, viaggioB, 1);

    const risposta = await report(contesto, contesto.sedeFisciano.id, '2026-10-01', '2026-10-31');

    expect(risposta.status).toBe(200);
    expect(risposta.body.totali).toEqual({
      viaggiCondivisi: 3,
      postiOfferti: 9,
      passeggeriTrasportati: 3,
    });
    expect(risposta.body.mesi).toEqual([{
      mese: '2026-10',
      viaggiCondivisi: 3,
      postiOfferti: 9,
      passeggeriTrasportati: 3,
    }]);
  });

  test('Report: un Membro senza il ruolo riceve 403', async () => {
    const risposta = await report(
      contesto,
      contesto.sedeFisciano.id,
      '2026-10-01',
      '2026-10-31',
      contesto.cookieMembro,
    );

    expect(risposta.status).toBe(403);
  });

  test("Report: una sede di un'altra organizzazione riceve 403", async () => {
    const sedeAltra = await aggiungiSedeAltraOrganizzazione(contesto);
    const risposta = await report(contesto, sedeAltra.id, '2026-10-01', '2026-10-31');

    expect(risposta.status).toBe(403);
  });

  test('Report: periodo oltre 12 mesi, errore sulle date', async () => {
    const risposta = await report(contesto, contesto.sedeFisciano.id, '2025-11-30', '2026-12-01');

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'al' }));
  });
});
