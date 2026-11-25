// PersistenzaService: Facade di PersistenzaSubsystem, unico accesso a PostgreSQL
// (docs/sdd/README.md).
const { Pool } = require('pg');
const creaOperazioniOrganizzazioni = require('./OperazioniOrganizzazioni');
const creaOperazioniProfilo = require('./OperazioniProfilo');

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
const operazioniProfilo = creaOperazioniProfilo({ query });

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

async function esisteAccountEmail(email) {
  const righe = await query(
    'SELECT EXISTS (SELECT 1 FROM "Account" WHERE email = $1) AS esistente',
    [email],
  );
  return righe[0].esistente;
}

async function creaAccount(tx, { email, passwordHash }) {
  const righe = await tx.query(
    `INSERT INTO "Account" (email, "passwordHash", "tipoAccount", stato)
     VALUES ($1, $2, 'Membro', 'InAttesaDiVerifica')
     RETURNING id`,
    [email, passwordHash],
  );
  return righe[0].id;
}

async function creaMembro(tx, { nome, cognome, accountId, organizzazioneId }) {
  await tx.query(
    `INSERT INTO "Membro" (nome, cognome, "accountId", "organizzazioneId")
     VALUES ($1, $2, $3, $4)`,
    [nome, cognome, accountId, organizzazioneId],
  );
}

async function creaTokenVerifica(tx, { hashToken, scadenza, accountId }) {
  await tx.query(
    `INSERT INTO "TokenVerifica" (tipo, "hashToken", scadenza, "accountId")
     VALUES ('VerificaEmail', $1, $2, $3)`,
    [hashToken, scadenza, accountId],
  );
}

async function attivaAccountConTokenVerifica(hashToken, adesso) {
  return transazione(async (tx) => {
    const token = (
      await tx.query(
        `SELECT t.id, t."accountId"
         FROM "TokenVerifica" t
         JOIN "Account" a ON a.id = t."accountId"
         WHERE t."hashToken" = $1
           AND t.tipo = 'VerificaEmail'
           AND t.scadenza > $2
           AND t."usatoIl" IS NULL
           AND a.stato = 'InAttesaDiVerifica'
         FOR UPDATE OF t, a`,
        [hashToken, adesso],
      )
    )[0];
    if (!token) return false;

    const account = await tx.query(
      `UPDATE "Account" SET stato = 'Attivo'
       WHERE id = $1 AND stato = 'InAttesaDiVerifica'
       RETURNING id`,
      [token.accountId],
    );
    if (!account[0]) return false;

    const aggiornato = await tx.query(
      `UPDATE "TokenVerifica" SET "usatoIl" = $1
       WHERE id = $2 AND "usatoIl" IS NULL
       RETURNING id`,
      [adesso, token.id],
    );
    if (!aggiornato[0]) {
      throw new Error('Impossibile contrassegnare il token di verifica come usato');
    }
    return true;
  });
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
  creaSessione,
  verificaSessione,
  eliminaSessione,
  cercaViaggi,
  trovaOrganizzazioneAttivaPerDominio,
  esisteAccountEmail,
  creaAccount,
  creaMembro,
  creaTokenVerifica,
  attivaAccountConTokenVerifica,
  ...operazioniOrganizzazioni,
  ...operazioniProfilo,
  chiudi,
};
