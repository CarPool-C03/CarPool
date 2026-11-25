// PersistenzaService: Facade di PersistenzaSubsystem, unico accesso a PostgreSQL
const { Pool } = require('pg');
const creaOperazioniAccount = require('./OperazioniAccount');
const creaOperazioniOrganizzazioni = require('./OperazioniOrganizzazioni');
const creaOperazioniPrenotazioni = require('./OperazioniPrenotazioni');
const creaOperazioniProfilo = require('./OperazioniProfilo');
const creaOperazioniViaggi = require('./OperazioniViaggi');

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

const operazioniAccount = creaOperazioniAccount({ query, transazione });
const operazioniOrganizzazioni = creaOperazioniOrganizzazioni({ query, transazione });
const operazioniProfilo = creaOperazioniProfilo({ query });
const operazioniViaggi = creaOperazioniViaggi({ query });

async function cercaViaggi(filtro, membroId) {
  const zona = filtro.zona.replace(/[\\%_]/g, '\\$&');
  const adesso = new Date();
  return query(
    `SELECT v.id, v."dataOraPartenza", v."puntoPartenza",
            json_build_object('id', s.id, 'nome', s.nome) AS sede,
            v."postiOfferti",
            (v."postiOfferti" - COUNT(r.id)::integer) AS "postiDisponibili",
            v."contributoIndicativoEuro"::float8 AS "contributoIndicativoEuro",
            v.stato,
            json_build_object('id', c.id, 'nome', c.nome, 'cognome', c.cognome) AS conducente
     FROM "Viaggio" v
     JOIN "Sede" s ON s.id = v."sedeId"
     JOIN "Membro" c ON c.id = v."conducenteId"
     LEFT JOIN "RichiestaPrenotazione" r
       ON r."viaggioId" = v.id AND r.stato = 'Accettata'
     WHERE v.stato = 'Attivo'
       AND v."dataOraPartenza" > $5::timestamptz
       AND v."dataOraPartenza" >= (($3::date + $4::time) AT TIME ZONE 'Europe/Rome')
       AND v."dataOraPartenza" < (($3::date + INTERVAL '1 day') AT TIME ZONE 'Europe/Rome')
       AND v."sedeId" = $2
       AND v."conducenteId" <> $6
       AND v."puntoPartenza" ILIKE $1 ESCAPE E'\\\\'
     GROUP BY v.id, s.id, c.id
     HAVING v."postiOfferti" - COUNT(r.id)::integer > 0
     ORDER BY v."dataOraPartenza"`,
    [`%${zona}%`, filtro.sedeId, filtro.data, filtro.orarioMinimo, adesso, membroId],
  );
}

async function trovaOrganizzazioneAttivaPerDominio(dominio) {
  return operazioniOrganizzazioni.cercaOrganizzazioneAttivaPerDominio(dominio);
}

// Chiude le connessioni (fine dei test o degli script).
async function chiudi() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = {
  query,
  transazione,
  cercaViaggi,
  trovaOrganizzazioneAttivaPerDominio,
  ...operazioniAccount,
  ...operazioniOrganizzazioni,
  ...creaOperazioniPrenotazioni({ query, transazione }),
  ...operazioniProfilo,
  ...operazioniViaggi,
  chiudi,
};
