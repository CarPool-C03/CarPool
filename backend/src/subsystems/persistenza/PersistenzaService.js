// PersistenzaService: Facade di PersistenzaSubsystem, unico accesso a PostgreSQL
// (docs/sdd/README.md).
const { Pool } = require('pg');
const creaOperazioniOrganizzazioni = require('./OperazioniOrganizzazioni');

let pool = null;

function ottieniPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non impostata: vedi backend/.env.example');
  }
  const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false;
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
  return pool;
}

async function query(sql, parametri = []) {
  const risultato = await ottieniPool().query(sql, parametri);
  return risultato.rows;
}

async function transazione(fn) {
  const client = await ottieniPool().connect();
  const tx = {
    query: async (sql, parametri = []) => (await client.query(sql, parametri)).rows,
  };
  try {
    await client.query('BEGIN');
    const risultato = await fn(tx);
    await client.query('COMMIT');
    return risultato;
  } catch (errore) {
    await client.query('ROLLBACK').catch(() => {});
    throw errore;
  } finally {
    client.release();
  }
}

const operazioniOrganizzazioni = creaOperazioniOrganizzazioni({ query, transazione });

async function creaSessione({ accountId, hashToken, ultimaAttivita }) {
  return query(
    `INSERT INTO "Sessione" ("accountId", "hashToken", "ultimaAttivita")
     VALUES ($1, $2, $3) RETURNING id`,
    [accountId, hashToken, ultimaAttivita],
  );
}

async function verificaSessione(hashToken, adesso) {
  const scadenza = new Date(adesso.getTime() - 30 * 60 * 1000);
  const righe = await query(
    `UPDATE "Sessione" SET "ultimaAttivita" = $1
     WHERE "hashToken" = $2 AND "ultimaAttivita" > $3
       AND EXISTS (
         SELECT 1 FROM "Account"
         WHERE "Account".id = "Sessione"."accountId" AND stato = 'Attivo'
       )
     RETURNING "accountId"`,
    [adesso, hashToken, scadenza],
  );
  return righe[0] ?? null;
}

async function eliminaSessione(hashToken) {
  await query('DELETE FROM "Sessione" WHERE "hashToken" = $1', [hashToken]);
}

async function chiudi() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = {
  query,
  transazione,
  creaSessione,
  verificaSessione,
  eliminaSessione,
  ...operazioniOrganizzazioni,
  chiudi,
};
