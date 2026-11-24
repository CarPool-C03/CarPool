const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');

const DATA_ORA = '2026-12-03T08:00:00+01:00';

async function creaOrganizzazione(tx, denominazione = 'Organizzazione test') {
  const righe = await tx.query(
    'INSERT INTO "Organizzazione" ("denominazione") VALUES ($1) RETURNING "id"',
    [denominazione],
  );
  return righe[0].id;
}

async function creaAccount(tx, email) {
  const righe = await tx.query(
    `INSERT INTO "Account" ("email", "passwordHash", "tipoAccount", "stato")
     VALUES ($1, 'hash-test', 'Membro', 'Attivo') RETURNING "id"`,
    [email],
  );
  return righe[0].id;
}

async function creaMembro(tx, organizzazioneId, email) {
  const accountId = await creaAccount(tx, email);
  const righe = await tx.query(
    `INSERT INTO "Membro" ("nome", "cognome", "accountId", "organizzazioneId")
     VALUES ('Test', 'Membro', $1, $2) RETURNING "id"`,
    [accountId, organizzazioneId],
  );
  return righe[0].id;
}

async function creaContestoViaggio(tx) {
  const organizzazioneId = await creaOrganizzazione(tx);
  const membroId = await creaMembro(tx, organizzazioneId, 'conducente@example.test');
  const sede = await tx.query(
    `INSERT INTO "Sede" ("nome", "indirizzo", "organizzazioneId")
     VALUES ('Sede test', 'Indirizzo test', $1) RETURNING "id"`,
    [organizzazioneId],
  );
  const evento = await tx.query(
    `INSERT INTO "Evento" ("nome", "dataOraInizio", "luogo", "organizzazioneId")
     VALUES ('Evento test', $1, 'Luogo test', $2) RETURNING "id"`,
    [DATA_ORA, organizzazioneId],
  );
  return { membroId, sedeId: sede[0].id, eventoId: evento[0].id, organizzazioneId };
}

async function creaViaggio(tx, contesto, sedeId, eventoId, postiOfferti = 2) {
  return tx.query(
    `INSERT INTO "Viaggio"
      ("dataOraPartenza", "puntoPartenza", "postiOfferti", "conducenteId", "sedeId", "eventoId")
     VALUES ($1, 'Partenza test', $2, $3, $4, $5) RETURNING "id"`,
    [DATA_ORA, postiOfferti, contesto.membroId, sedeId, eventoId],
  );
}

describe('Schema', () => {
  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('Schema: rifiuta un Viaggio con sedeId ed eventoId entrambi valorizzati', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const contesto = await creaContestoViaggio(tx);
        await creaViaggio(tx, contesto, contesto.sedeId, contesto.eventoId);
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: rifiuta un Viaggio senza sedeId né eventoId', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const contesto = await creaContestoViaggio(tx);
        await creaViaggio(tx, contesto, null, null);
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: rifiuta postiOfferti minore di 1', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const contesto = await creaContestoViaggio(tx);
        await creaViaggio(tx, contesto, contesto.sedeId, null, 0);
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: rifiuta un punteggio fuori da 1..5', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const contesto = await creaContestoViaggio(tx);
        const valutatoId = await creaMembro(tx, contesto.organizzazioneId, 'passeggero@example.test');
        const viaggio = await creaViaggio(tx, contesto, contesto.sedeId, null);
        const viaggioId = viaggio[0].id;
        await tx.query(
          `INSERT INTO "Valutazione" ("punteggio", "autoreId", "valutatoId", "viaggioId")
           VALUES (0, $1, $2, $3)`,
          [contesto.membroId, valutatoId, viaggioId],
        );
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: rifiuta una seconda Valutazione con stessi autore, valutato e viaggio', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const contesto = await creaContestoViaggio(tx);
        const valutatoId = await creaMembro(tx, contesto.organizzazioneId, 'passeggero@example.test');
        const viaggio = await creaViaggio(tx, contesto, contesto.sedeId, null);
        const valori = [4, contesto.membroId, valutatoId, viaggio[0].id];
        const query = `INSERT INTO "Valutazione" ("punteggio", "autoreId", "valutatoId", "viaggioId")
                       VALUES ($1, $2, $3, $4)`;
        await tx.query(query, valori);
        await tx.query(query, valori);
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  test("Schema: rifiuta un'e-mail di Account già presente", async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        await creaAccount(tx, 'duplicata@example.test');
        await creaAccount(tx, 'duplicata@example.test');
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  test("Schema: rifiuta un dominio già usato da un'altra organizzazione", async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const prima = await creaOrganizzazione(tx, 'Prima');
        const seconda = await creaOrganizzazione(tx, 'Seconda');
        await tx.query(
          'INSERT INTO "DominioEmail" ("dominio", "organizzazioneId") VALUES ($1, $2)',
          ['duplicato.example', prima],
        );
        await tx.query(
          'INSERT INTO "DominioEmail" ("dominio", "organizzazioneId") VALUES ($1, $2)',
          ['duplicato.example', seconda],
        );
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  test('Schema: rifiuta una seconda richiesta attiva dello stesso passeggero per lo stesso viaggio', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const contesto = await creaContestoViaggio(tx);
        const passeggeroId = await creaMembro(tx, contesto.organizzazioneId, 'passeggero@example.test');
        const viaggio = await creaViaggio(tx, contesto, contesto.sedeId, null);
        const query = `INSERT INTO "RichiestaPrenotazione" ("passeggeroId", "viaggioId", "stato")
                       VALUES ($1, $2, $3)`;
        await tx.query(query, [passeggeroId, viaggio[0].id, 'InAttesa']);
        await tx.query(query, [passeggeroId, viaggio[0].id, 'Accettata']);
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });
});
