const { randomUUID } = require('node:crypto');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');

const emailTest = () => `account-${randomUUID()}@example.test`;

async function creaAccount(tx, { email = emailTest(), tipoAccount = 'Membro', stato = 'Attivo' } = {}) {
  const [account] = await tx.query(
    `INSERT INTO "Account" (email, "passwordHash", "tipoAccount", stato)
     VALUES ($1, 'hash-test', $2, $3) RETURNING id`,
    [email, tipoAccount, stato],
  );
  return account.id;
}

async function creaOrganizzazione(tx) {
  const [organizzazione] = await tx.query(
    'INSERT INTO "Organizzazione" (denominazione) VALUES ($1) RETURNING id',
    [`Organizzazione ${randomUUID()}`],
  );
  return organizzazione.id;
}

async function creaToken(tx, accountId, hashToken, tipo = 'VerificaEmail') {
  await tx.query(
    `INSERT INTO "TokenVerifica" (tipo, "hashToken", scadenza, "accountId")
     VALUES ($1, $2, NOW() + INTERVAL '1 day', $3)`,
    [tipo, hashToken, accountId],
  );
}

describe('Schema Account', () => {
  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('Schema: rifiuta uno stato di Account non previsto', async () => {
    await expect(
      PersistenzaService.transazione((tx) =>
        creaAccount(tx, { stato: 'NonValido' }),
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: rifiuta un tipoAccount non previsto', async () => {
    await expect(
      PersistenzaService.transazione((tx) =>
        creaAccount(tx, { tipoAccount: 'NonValido' }),
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test("Schema: rifiuta un'e-mail di Account con lettere maiuscole", async () => {
    await expect(
      PersistenzaService.transazione((tx) =>
        creaAccount(tx, { email: `Utente-${randomUUID()}@example.test` }),
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: un Account inserito senza stato è InAttesaDiVerifica', async () => {
    let stato;
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const [account] = await tx.query(
          `INSERT INTO "Account" (email, "passwordHash", "tipoAccount")
           VALUES ($1, 'hash-test', 'Membro') RETURNING stato`,
          [emailTest()],
        );
        stato = account.stato;
        throw new Error('Rollback del test');
      }),
    ).rejects.toThrow('Rollback del test');
    expect(stato).toBe('InAttesaDiVerifica');
  });

  test('Schema: rifiuta un tipo di TokenVerifica non previsto', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const accountId = await creaAccount(tx);
        await creaToken(tx, accountId, randomUUID(), 'NonValido');
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('Schema: rifiuta un hashToken di Sessione già presente', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const accountId = await creaAccount(tx);
        const inserisci = `INSERT INTO "Sessione" ("hashToken", "ultimaAttivita", "accountId")
                           VALUES ($1, NOW(), $2)`;
        const hashToken = randomUUID();
        await tx.query(inserisci, [hashToken, accountId]);
        await tx.query(inserisci, [hashToken, accountId]);
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  test('Schema: rifiuta un hashToken di TokenVerifica già presente', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const accountId = await creaAccount(tx);
        const hashToken = randomUUID();
        await creaToken(tx, accountId, hashToken);
        await creaToken(tx, accountId, hashToken);
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  test('Schema: rifiuta un secondo Membro per lo stesso Account', async () => {
    await expect(
      PersistenzaService.transazione(async (tx) => {
        const accountId = await creaAccount(tx);
        const organizzazioneId = await creaOrganizzazione(tx);
        const inserisci = `INSERT INTO "Membro" (nome, cognome, "accountId", "organizzazioneId")
                           VALUES ('Test', 'Membro', $1, $2)`;
        await tx.query(inserisci, [accountId, organizzazioneId]);
        await tx.query(inserisci, [accountId, organizzazioneId]);
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  test('Schema: rifiuta una Sessione con accountId inesistente', async () => {
    await expect(
      PersistenzaService.transazione((tx) =>
        tx.query(
          `INSERT INTO "Sessione" ("hashToken", "ultimaAttivita", "accountId")
           VALUES ($1, NOW(), -1)`,
          [randomUUID()],
        ),
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  test('Schema: esistono gli indici su Sessione.accountId e TokenVerifica.accountId', async () => {
    const righe = await PersistenzaService.query(
      `SELECT indexname FROM pg_indexes
       WHERE indexname IN ('sessione_account_idx', 'token_verifica_account_idx')`,
    );
    expect(righe).toHaveLength(2);
  });
});
