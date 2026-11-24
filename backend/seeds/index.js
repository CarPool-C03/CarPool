require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const PersistenzaService = require('../src/subsystems/persistenza/PersistenzaService');

const PASSWORD_SVILUPPO = 'CarPool-dev-2026!';
const MEMBRI = [
  { nome: 'Luca', cognome: 'Verdi', email: 'luca.verdi@studenti.unisa.it', veicolo: true },
  { nome: 'Anna', cognome: 'Bianchi', email: 'anna.bianchi@studenti.unisa.it' },
  { nome: 'Marco', cognome: 'Russo', email: 'marco.russo@studenti.unisa.it' },
  { nome: 'Sara', cognome: 'Galli', email: 'sara.galli@studenti.unisa.it' },
  {
    nome: 'Paolo',
    cognome: 'Neri',
    email: 'paolo.neri@studenti.unisa.it',
    mobilityManager: true,
  },
];

async function creaOrganizzazione(tx) {
  const esistenti = await tx.query(
    'SELECT "id" FROM "Organizzazione" WHERE "denominazione" = $1',
    ['Università degli Studi di Salerno'],
  );
  if (esistenti.length) return esistenti[0].id;

  const righe = await tx.query(
    'INSERT INTO "Organizzazione" ("denominazione", "attiva") VALUES ($1, TRUE) RETURNING "id"',
    ['Università degli Studi di Salerno'],
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
  const righe = await tx.query(
    'SELECT "id" FROM "Sede" WHERE "nome" = $1 AND "organizzazioneId" = $2',
    [nome, organizzazioneId],
  );
  if (righe.length) return righe[0].id;

  const inserite = await tx.query(
    `INSERT INTO "Sede" ("nome", "indirizzo", "organizzazioneId")
     VALUES ($1, $2, $3) RETURNING "id"`,
    [nome, indirizzo, organizzazioneId],
  );
  return inserite[0].id;
}

async function creaAccount(tx, email, tipoAccount = 'Membro') {
  const passwordHash = await bcrypt.hash(PASSWORD_SVILUPPO, 10);
  const righe = await tx.query(
    `INSERT INTO "Account" ("email", "passwordHash", "tipoAccount", "stato")
     VALUES ($1, $2, $3, 'Attivo')
     ON CONFLICT ("email") DO UPDATE
     SET "passwordHash" = EXCLUDED."passwordHash",
         "tipoAccount" = EXCLUDED."tipoAccount",
         "stato" = 'Attivo'
     RETURNING "id"`,
    [email, passwordHash, tipoAccount],
  );
  return righe[0].id;
}

async function creaMembro(tx, organizzazioneId, dati) {
  const accountId = await creaAccount(tx, dati.email);
  const righe = await tx.query(
    `INSERT INTO "Membro" ("nome", "cognome", "ruoloMobilityManager", "accountId", "organizzazioneId")
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ("accountId") DO UPDATE
     SET "nome" = EXCLUDED."nome",
         "cognome" = EXCLUDED."cognome",
         "ruoloMobilityManager" = EXCLUDED."ruoloMobilityManager",
         "organizzazioneId" = EXCLUDED."organizzazioneId"
     RETURNING "id"`,
    [dati.nome, dati.cognome, Boolean(dati.mobilityManager), accountId, organizzazioneId],
  );
  return righe[0].id;
}

async function creaVeicolo(tx, membroId) {
  await tx.query(
    `INSERT INTO "Veicolo" ("modello", "colore", "numeroPostiPasseggeri", "membroId")
     VALUES ('Fiat Panda', 'Bianco', 4, $1)
     ON CONFLICT ("membroId") DO UPDATE
     SET "modello" = EXCLUDED."modello",
         "colore" = EXCLUDED."colore",
         "numeroPostiPasseggeri" = EXCLUDED."numeroPostiPasseggeri"`,
    [membroId],
  );
}

async function creaViaggio(tx, conducenteId, sedeId, dataOraPartenza) {
  const esistenti = await tx.query(
    `SELECT "id" FROM "Viaggio"
     WHERE "conducenteId" = $1 AND "sedeId" = $2 AND "dataOraPartenza" = $3`,
    [conducenteId, sedeId, dataOraPartenza],
  );
  if (esistenti.length) return;

  await tx.query(
    `INSERT INTO "Viaggio" ("dataOraPartenza", "puntoPartenza", "postiOfferti", "conducenteId", "sedeId")
     VALUES ($1, 'Piazza della Libertà, Salerno', 3, $2, $3)`,
    [dataOraPartenza, conducenteId, sedeId],
  );
}

async function main() {
  const organizzazioneId = await PersistenzaService.transazione(async (tx) => {
    const id = await creaOrganizzazione(tx);
    await creaDominio(tx, id);
    const fiscianoId = await creaSede(tx, id, 'Campus di Fisciano', 'Via Giovanni Paolo II, 132');
    const baronissiId = await creaSede(tx, id, 'Campus di Baronissi', 'Via S. Allende, 1');
    const membri = {};

    for (const dati of MEMBRI) {
      membri[dati.email] = await creaMembro(tx, id, dati);
      if (dati.veicolo) await creaVeicolo(tx, membri[dati.email]);
    }

    await creaAccount(tx, 'amministratore@carpool.local', 'Amministratore');
    await creaViaggio(tx, membri['luca.verdi@studenti.unisa.it'], fiscianoId, '2026-12-03T08:00:00+01:00');
    await creaViaggio(tx, membri['luca.verdi@studenti.unisa.it'], baronissiId, '2026-12-04T08:00:00+01:00');
    return id;
  });
  console.log(`Seed completati per l'organizzazione ${organizzazioneId}.`);
}

main()
  .catch((errore) => {
    console.error(`Seed non riusciti: ${errore.message}`);
    process.exitCode = 1;
  })
  .finally(() => PersistenzaService.chiudi());
