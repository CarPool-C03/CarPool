require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const PersistenzaService = require('../src/subsystems/persistenza/PersistenzaService');

const NOME_ORGANIZZAZIONE = 'Università degli Studi di Salerno';
const EMAIL_AMMINISTRATORE = 'amministratore@carpool.example';

async function creaOrganizzazione(tx) {
  const esistenti = await tx.query(
    'SELECT "id" FROM "Organizzazione" WHERE "denominazione" = $1',
    [NOME_ORGANIZZAZIONE],
  );
  if (esistenti.length) {
    await tx.query('UPDATE "Organizzazione" SET "attiva" = TRUE WHERE "id" = $1', [
      esistenti[0].id,
    ]);
    return esistenti[0].id;
  }

  const righe = await tx.query(
    'INSERT INTO "Organizzazione" ("denominazione", "attiva") VALUES ($1, TRUE) RETURNING "id"',
    [NOME_ORGANIZZAZIONE],
  );
  return righe[0].id;
}

async function creaDominio(tx, organizzazioneId) {
  await tx.query(
    `INSERT INTO "DominioEmail" ("dominio", "organizzazioneId")
     VALUES ($1, $2)
     ON CONFLICT ("dominio") DO UPDATE SET "organizzazioneId" = EXCLUDED."organizzazioneId"`,
    ['studenti.unisa.it', organizzazioneId],
  );
}

async function creaSede(tx, organizzazioneId, nome, indirizzo) {
  const esistenti = await tx.query(
    'SELECT "id" FROM "Sede" WHERE "nome" = $1 AND "organizzazioneId" = $2',
    [nome, organizzazioneId],
  );
  if (esistenti.length) return esistenti[0].id;

  const righe = await tx.query(
    `INSERT INTO "Sede" ("nome", "indirizzo", "organizzazioneId")
     VALUES ($1, $2, $3) RETURNING "id"`,
    [nome, indirizzo, organizzazioneId],
  );
  return righe[0].id;
}

async function creaAmministratore(tx, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  await tx.query(
    `INSERT INTO "Account" ("email", "passwordHash", "tipoAccount", "stato")
     VALUES ($1, $2, 'Amministratore', 'Attivo')
     ON CONFLICT ("email") DO UPDATE
     SET "passwordHash" = EXCLUDED."passwordHash",
         "tipoAccount" = EXCLUDED."tipoAccount",
         "stato" = 'Attivo'`,
    [EMAIL_AMMINISTRATORE, passwordHash],
  );
}

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD è obbligatoria per il seed di produzione.');
  }

  const organizzazioneId = await PersistenzaService.transazione(async (tx) => {
    const id = await creaOrganizzazione(tx);
    await creaDominio(tx, id);
    await creaSede(tx, id, 'Campus di Fisciano', 'Via Giovanni Paolo II, 132');
    await creaSede(tx, id, 'Campus di Baronissi', 'Via S. Allende, 1');
    await creaAmministratore(tx, password);
    return id;
  });
  console.log(`Seed di produzione completato per l'organizzazione ${organizzazioneId}.`);
}

main()
  .catch((errore) => {
    console.error(`Seed di produzione non riuscito: ${errore.message}`);
    process.exitCode = 1;
  })
  .finally(() => PersistenzaService.chiudi());
