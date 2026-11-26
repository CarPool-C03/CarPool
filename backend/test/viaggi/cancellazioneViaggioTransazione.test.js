const { randomUUID } = require('node:crypto');
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

describe('Transazione di cancellazione del viaggio', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  test('TC_TRIP_04.12 - Cancellazione: rollback se l’aggiornamento del viaggio fallisce', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    const passeggero = await aggiungiAccount(contesto);
    await allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId);
    const [richiestaId] = await PersistenzaService.query(
      `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
       VALUES ('InAttesa', $1, $2) RETURNING id`,
      [passeggero.membroId, creata.body.id],
    );
    const suffisso = randomUUID().replace(/-/g, '');
    const funzione = `test_errore_cancellazione_${suffisso}`;
    const trigger = `test_trigger_cancellazione_${suffisso}`;
    await PersistenzaService.query(
      `CREATE FUNCTION "${funzione}"() RETURNS trigger LANGUAGE plpgsql AS $$
       BEGIN
         IF NEW.id = ${creata.body.id} AND NEW.stato = 'Cancellato' THEN
           RAISE EXCEPTION 'errore di test';
         END IF;
         RETURN NEW;
       END $$`,
    );
    await PersistenzaService.query(
      `CREATE TRIGGER "${trigger}" BEFORE UPDATE OF stato ON "Viaggio"
       FOR EACH ROW EXECUTE FUNCTION "${funzione}"()`,
    );
    try {
      const risposta = await request(creaApp())
        .delete(`/api/viaggi/${creata.body.id}`)
        .set('Cookie', contesto.cookie);
      const [viaggio] = await PersistenzaService.query(
        'SELECT stato FROM "Viaggio" WHERE id = $1',
        [creata.body.id],
      );
      const [richiestaSalvata] = await PersistenzaService.query(
        'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
        [richiestaId.id],
      );

      expect(risposta.status).toBe(500);
      expect(viaggio.stato).toBe('Attivo');
      expect(richiestaSalvata.stato).toBe('InAttesa');
    } finally {
      await PersistenzaService.query(`DROP TRIGGER "${trigger}" ON "Viaggio"`);
      await PersistenzaService.query(`DROP FUNCTION "${funzione}"()`);
    }
  });
});
