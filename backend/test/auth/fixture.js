const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');

const PASSWORD = 'Password-di-test-47!';

async function creaAccount({ tipoAccount = 'Membro', stato = 'Attivo' } = {}) {
  const suffisso = randomUUID();
  return PersistenzaService.transazione(async (tx) => {
    const [organizzazione] = await tx.query(
      'INSERT INTO "Organizzazione" ("denominazione") VALUES ($1) RETURNING id',
      [`Organizzazione test ${suffisso}`],
    );
    await tx.query(
      'INSERT INTO "DominioEmail" ("dominio", "organizzazioneId") VALUES ($1, $2)',
      [`${suffisso}.test`, organizzazione.id],
    );
    const [account] = await tx.query(
      'INSERT INTO "Account" ("email", "passwordHash", "tipoAccount", "stato") VALUES ($1, $2, $3, $4) RETURNING id',
      [
        `utente-${suffisso}@test.local`,
        await bcrypt.hash(PASSWORD, 4),
        tipoAccount,
        stato,
      ],
    );
    let membroId = null;
    if (tipoAccount === 'Membro') {
      const [membro] = await tx.query(
        'INSERT INTO "Membro" ("nome", "cognome", "accountId", "organizzazioneId") VALUES ($1, $2, $3, $4) RETURNING id',
        ['Utente', 'Test', account.id, organizzazione.id],
      );
      membroId = membro.id;
    }
    return { ...account, email: `utente-${suffisso}@test.local`, organizzazioneId: organizzazione.id, membroId };
  });
}

async function eliminaAccount(account) {
  await PersistenzaService.transazione(async (tx) => {
    await tx.query('DELETE FROM "Sessione" WHERE "accountId" = $1', [account.id]);
    await tx.query('DELETE FROM "Membro" WHERE "accountId" = $1', [account.id]);
    await tx.query('DELETE FROM "Account" WHERE id = $1', [account.id]);
    await tx.query('DELETE FROM "DominioEmail" WHERE "organizzazioneId" = $1', [
      account.organizzazioneId,
    ]);
    await tx.query('DELETE FROM "Organizzazione" WHERE id = $1', [account.organizzazioneId]);
  });
}

module.exports = { PASSWORD, creaAccount, eliminaAccount };
