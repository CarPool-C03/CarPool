// PersistenzaService: Facade di PersistenzaSubsystem, unico accesso a PostgreSQL
// (docs/sdd/README.md). Le funzioni per gruppo di entità si aggiungono nei task L2.
const { Pool } = require('pg');

let pool = null;

function ottieniPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non impostata: vedi backend/.env.example');
  }
  // TLS solo se richiesto (database in cloud); in locale e in CI resta disattivato.
  const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false;
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
  return pool;
}

// Esegue una query parametrizzata ($1, $2, ...) e restituisce le righe.
async function query(sql, parametri = []) {
  const risultato = await ottieniPool().query(sql, parametri);
  return risultato.rows;
}

// Esegue fn dentro una transazione: COMMIT se fn termina, ROLLBACK se lancia un errore.
// fn riceve un oggetto con la stessa query(sql, parametri), legata alla transazione (DG_5).
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

// Chiude le connessioni (fine dei test o degli script).
async function chiudi() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = { query, transazione, chiudi };
