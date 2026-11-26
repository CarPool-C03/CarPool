const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiAccount,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  eliminaConCookie,
  login,
  pulisciContesto,
} = require('./fixture');

describe('Eliminazione account - transazione', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContesto();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
  });

  test('TC_AUTH_07.08 - Eliminazione: errore durante una scrittura annulla tutte le modifiche', async () => {
    const passeggero = await aggiungiAccount(contesto);
    const viaggioId = await creaViaggio(contesto, contesto.account);
    const richiestaId = await creaRichiesta(passeggero, viaggioId, 'InAttesa');
    const membroId = contesto.account.membroId;
    await PersistenzaService.query(
      `INSERT INTO "Veicolo" (modello, colore, "numeroPostiPasseggeri", "membroId")
       VALUES ('Fiat Panda', 'Bianco', 4, $1)`,
      [membroId],
    );
    await PersistenzaService.query(
      `INSERT INTO "Messaggio" (testo, "dataOraInvio", "mittenteId", "viaggioId")
       VALUES ('Messaggio di test', NOW(), $1, $2)`,
      [membroId, viaggioId],
    );
    await PersistenzaService.query(
      `INSERT INTO "Valutazione" (punteggio, "autoreId", "valutatoId", "viaggioId")
       VALUES (5, $1, $2, $3)`,
      [membroId, passeggero.membroId, viaggioId],
    );
    const cookie = await login(contesto.account);
    const suffix = randomUUID().replace(/-/g, '');
    const funzione = `test_errore_eliminazione_${suffix}`;
    const trigger = `test_trigger_eliminazione_${suffix}`;

    await PersistenzaService.query(
      `CREATE FUNCTION "${funzione}"() RETURNS trigger LANGUAGE plpgsql AS $$
       BEGIN
         RAISE EXCEPTION 'errore di test';
       END $$`,
    );
    await PersistenzaService.query(
      `CREATE TRIGGER "${trigger}" BEFORE UPDATE OF stato ON "Account"
       FOR EACH ROW WHEN (NEW.stato = 'Eliminato')
       EXECUTE FUNCTION "${funzione}"()`,
    );

    try {
      const risposta = await eliminaConCookie(cookie);
      const [account] = await PersistenzaService.query(
        'SELECT email, stato FROM "Account" WHERE id = $1',
        [contesto.account.id],
      );
      const [membro] = await PersistenzaService.query(
        'SELECT nome, cognome FROM "Membro" WHERE id = $1',
        [membroId],
      );
      const [viaggio] = await PersistenzaService.query(
        'SELECT stato FROM "Viaggio" WHERE id = $1',
        [viaggioId],
      );
      const [prenotazione] = await PersistenzaService.query(
        'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
        [richiestaId],
      );
      const veicoli = await PersistenzaService.query(
        'SELECT id FROM "Veicolo" WHERE "membroId" = $1',
        [membroId],
      );
      const messaggi = await PersistenzaService.query(
        'SELECT id FROM "Messaggio" WHERE "mittenteId" = $1',
        [membroId],
      );
      const valutazioni = await PersistenzaService.query(
        'SELECT id FROM "Valutazione" WHERE "autoreId" = $1 OR "valutatoId" = $1',
        [membroId],
      );
      const sessione = await request(creaApp()).get('/api/auth/me').set('Cookie', cookie);

      expect(risposta.status).toBe(500);
      expect(account).toEqual({ email: contesto.account.email, stato: 'Attivo' });
      expect(membro).toEqual({ nome: 'Utente', cognome: 'Test' });
      expect(viaggio.stato).toBe('Attivo');
      expect(prenotazione.stato).toBe('InAttesa');
      expect(veicoli).toHaveLength(1);
      expect(messaggi).toHaveLength(1);
      expect(valutazioni).toHaveLength(1);
      expect(sessione.status).toBe(200);
    } finally {
      await PersistenzaService.query(`DROP TRIGGER "${trigger}" ON "Account"`);
      await PersistenzaService.query(`DROP FUNCTION "${funzione}"()`);
    }
  });
});
