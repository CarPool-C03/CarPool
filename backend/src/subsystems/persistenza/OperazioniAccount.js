function creaOperazioniAccount({ query, transazione }) {
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

  async function esisteAccountEmail(email) {
    const righe = await query(
      'SELECT EXISTS (SELECT 1 FROM "Account" WHERE email = $1) AS esistente',
      [email],
    );
    return righe[0].esistente;
  }

  async function trovaAccountPerEmail(email) {
    const righe = await query(
      'SELECT id, "passwordHash", stato FROM "Account" WHERE email = $1',
      [email],
    );
    return righe[0] ?? null;
  }

  async function recuperaUtenteCorrente(accountId) {
    const righe = await query(
      `SELECT a.id, a.email, a."tipoAccount", m.id AS "membroId",
              m.nome, m.cognome, m."ruoloMobilityManager",
              o.id AS "organizzazioneId", o.denominazione
       FROM "Account" a
       LEFT JOIN "Membro" m ON m."accountId" = a.id
       LEFT JOIN "Organizzazione" o ON o.id = m."organizzazioneId"
       WHERE a.id = $1 AND a.stato = 'Attivo'`,
      [accountId],
    );
    return righe[0] ?? null;
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

  return {
    creaSessione,
    verificaSessione,
    eliminaSessione,
    esisteAccountEmail,
    trovaAccountPerEmail,
    recuperaUtenteCorrente,
    creaAccount,
    creaMembro,
    creaTokenVerifica,
    attivaAccountConTokenVerifica,
  };
}

module.exports = creaOperazioniAccount;
