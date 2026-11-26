jest.mock('node-cron', () => ({ schedule: jest.fn() }));

const { randomUUID } = require('node:crypto');
const cron = require('node-cron');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const ViaggioPrenotazioneService = require('../../src/subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const LogService = require('../../src/subsystems/logging/LogService');
const { avviaPianificazione } = require('../../src/pianificazione');
const {
  aggiungiAccount,
  creaContesto,
  fissaOrologio,
  pulisciContesto,
  ripristinaOrologio,
} = require('../viaggi/fixture');

const ISTANTE = '2026-12-01T10:00:00+01:00';

function orePrima(ore) {
  return new Date(Date.parse(ISTANTE) - ore * 60 * 60 * 1000);
}

async function creaViaggio(contesto, partenza, stato = 'Attivo') {
  const [viaggio] = await PersistenzaService.query(
    `INSERT INTO "Viaggio"
       ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
     VALUES ($1, 'Salerno', 2, $2, $3, $4)
     RETURNING id`,
    [partenza, stato, contesto.conducente.membroId, contesto.sede.id],
  );
  return viaggio.id;
}

async function creaRichiesta(passeggeroId, viaggioId, stato) {
  const [richiesta] = await PersistenzaService.query(
    `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
     VALUES ($1, $2, $3) RETURNING id`,
    [stato, passeggeroId, viaggioId],
  );
  return richiesta.id;
}

describe('Conclusione automatica dei viaggi', () => {
  let contesto;

  beforeEach(async () => {
    cron.schedule.mockReset();
    fissaOrologio();
    contesto = await creaContesto();
  });

  afterEach(async () => {
    try {
      await pulisciContesto(contesto);
    } finally {
      ripristinaOrologio();
    }
  });

  test('Conclusione automatica: applica la soglia stretta e completa solo le richieste accettate', async () => {
    const scaduto = await creaViaggio(contesto, orePrima(3));
    const recente = await creaViaggio(contesto, orePrima(1));
    const limite = await creaViaggio(contesto, orePrima(2));
    const concluso = await creaViaggio(contesto, orePrima(3), 'Concluso');
    const cancellato = await creaViaggio(contesto, orePrima(3), 'Cancellato');
    const passeggeroAccettato = await aggiungiAccount(contesto);
    const passeggeroInAttesa = await aggiungiAccount(contesto);
    await creaRichiesta(passeggeroAccettato.membroId, scaduto, 'Accettata');
    await creaRichiesta(passeggeroInAttesa.membroId, scaduto, 'InAttesa');

    const numero = await ViaggioPrenotazioneService.concludiViaggiScaduti(new Date(ISTANTE));
    expect(numero).toBe(1);

    const viaggi = await PersistenzaService.query(
      'SELECT id, stato FROM "Viaggio" WHERE id = ANY($1::integer[])',
      [[scaduto, recente, limite, concluso, cancellato]],
    );
    const stati = Object.fromEntries(viaggi.map(({ id, stato }) => [id, stato]));
    expect(stati).toEqual({
      [scaduto]: 'Concluso',
      [recente]: 'Attivo',
      [limite]: 'Attivo',
      [concluso]: 'Concluso',
      [cancellato]: 'Cancellato',
    });

    const richieste = await PersistenzaService.query(
      'SELECT stato FROM "RichiestaPrenotazione" WHERE "viaggioId" = $1 ORDER BY id',
      [scaduto],
    );
    expect(richieste.map(({ stato }) => stato)).toEqual(['Completata', 'InAttesa']);
    await expect(
      ViaggioPrenotazioneService.concludiViaggiScaduti(new Date(ISTANTE)),
    ).resolves.toBe(0);
  });

  test('Conclusione automatica: rollback e logging se fallisce il completamento delle richieste', async () => {
    const viaggioId = await creaViaggio(contesto, orePrima(3));
    const passeggero = await aggiungiAccount(contesto);
    await creaRichiesta(passeggero.membroId, viaggioId, 'Accettata');
    const suffisso = randomUUID().replace(/-/g, '');
    const funzione = `test_errore_conclusione_${suffisso}`;
    const trigger = `test_trigger_conclusione_${suffisso}`;
    const registraErrore = jest.spyOn(LogService, 'registraErrore').mockImplementation(() => {});

    await PersistenzaService.query(
      `CREATE FUNCTION "${funzione}"() RETURNS trigger LANGUAGE plpgsql AS $$
       BEGIN
         IF NEW.stato = 'Completata' THEN
           RAISE EXCEPTION 'errore di test';
         END IF;
         RETURN NEW;
       END $$`,
    );
    await PersistenzaService.query(
      `CREATE TRIGGER "${trigger}" BEFORE UPDATE OF stato ON "RichiestaPrenotazione"
       FOR EACH ROW EXECUTE FUNCTION "${funzione}"()`,
    );

    try {
      avviaPianificazione();
      const callback = cron.schedule.mock.calls[0][1];
      await callback();
      const [viaggio] = await PersistenzaService.query(
        'SELECT stato FROM "Viaggio" WHERE id = $1',
        [viaggioId],
      );
      const [richiesta] = await PersistenzaService.query(
        'SELECT stato FROM "RichiestaPrenotazione" WHERE "viaggioId" = $1',
        [viaggioId],
      );
      expect(viaggio.stato).toBe('Attivo');
      expect(richiesta.stato).toBe('Accettata');
      expect(registraErrore).toHaveBeenCalledWith(
        expect.objectContaining({
          codice: 'ERRORE_INTERNO',
          sottosistema: 'viaggiPrenotazioni',
        }),
      );
      expect(registraErrore).toHaveBeenCalledTimes(1);
    } finally {
      await PersistenzaService.query(`DROP TRIGGER "${trigger}" ON "RichiestaPrenotazione"`);
      await PersistenzaService.query(`DROP FUNCTION "${funzione}"()`);
      registraErrore.mockRestore();
    }
  });
});
