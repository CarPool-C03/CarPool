function creaOperazioniOrganizzazioni({ query, transazione }) {
  async function cercaOrganizzazioneAttivaPerDominio(dominio) {
    const righe = await query(
      `SELECT o.id, o.denominazione
       FROM "Organizzazione" o
       JOIN "DominioEmail" d ON d."organizzazioneId" = o.id
       WHERE d.dominio = $1 AND o.attiva = TRUE`,
      [dominio],
    );
    return righe[0] ?? null;
  }

  async function registraOrganizzazione({ denominazione, sedi, domini }) {
    return transazione(async (tx) => {
      const [organizzazione] = await tx.query(
        `INSERT INTO "Organizzazione" (denominazione, attiva)
         VALUES ($1, TRUE) RETURNING id, denominazione, attiva`,
        [denominazione],
      );
      const sediCreate = [];
      for (const sede of sedi) {
        const [inserita] = await tx.query(
          `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
           VALUES ($1, $2, $3) RETURNING id, nome, indirizzo`,
          [sede.nome, sede.indirizzo, organizzazione.id],
        );
        sediCreate.push(inserita);
      }
      for (const dominio of domini) {
        await tx.query(
          `INSERT INTO "DominioEmail" (dominio, "organizzazioneId")
           VALUES ($1, $2)`,
          [dominio, organizzazione.id],
        );
      }
      return { ...organizzazione, sedi: sediCreate, domini };
    });
  }

  async function aggiungiSediEDomini(organizzazioni) {
    if (!organizzazioni.length) return [];
    const ids = organizzazioni.map(({ id }) => id);
    const [sedi, domini] = await Promise.all([
      query(
        `SELECT id, nome, indirizzo, "organizzazioneId"
         FROM "Sede" WHERE "organizzazioneId" = ANY($1::integer[])
         ORDER BY nome, id`,
        [ids],
      ),
      query(
        `SELECT dominio, "organizzazioneId"
         FROM "DominioEmail" WHERE "organizzazioneId" = ANY($1::integer[])
         ORDER BY dominio`,
        [ids],
      ),
    ]);
    return organizzazioni.map((organizzazione) => ({
      ...organizzazione,
      sedi: sedi
        .filter((sede) => sede.organizzazioneId === organizzazione.id)
        .map(({ id, nome, indirizzo }) => ({ id, nome, indirizzo })),
      domini: domini
        .filter((dominio) => dominio.organizzazioneId === organizzazione.id)
        .map(({ dominio }) => dominio),
    }));
  }

  async function elencoOrganizzazioni() {
    const organizzazioni = await query(
      `SELECT id, denominazione, attiva FROM "Organizzazione"
       ORDER BY denominazione`,
    );
    return aggiungiSediEDomini(organizzazioni);
  }

  async function dettaglioOrganizzazione(id) {
    const organizzazioni = await query(
      `SELECT id, denominazione, attiva FROM "Organizzazione" WHERE id = $1`,
      [id],
    );
    if (!organizzazioni.length) return null;
    const [organizzazione] = await aggiungiSediEDomini(organizzazioni);
    return organizzazione;
  }

  async function sediOrganizzazione(organizzazioneId) {
    return query(
      `SELECT id, nome, indirizzo FROM "Sede"
       WHERE "organizzazioneId" = $1 ORDER BY nome, id`,
      [organizzazioneId],
    );
  }

  async function cercaMembri(email) {
    const testo = email.replace(/[\\%_]/g, '\\$&');
    return query(
      `SELECT m.id, m.nome, m.cognome, a.email, a.stato AS "statoAccount",
              m."ruoloMobilityManager",
              json_build_object('id', o.id, 'denominazione', o.denominazione) AS organizzazione
       FROM "Membro" m
       JOIN "Account" a ON a.id = m."accountId"
       JOIN "Organizzazione" o ON o.id = m."organizzazioneId"
       WHERE a.email ILIKE $1 ESCAPE E'\\\\'
       ORDER BY a.email`,
      [`%${testo}%`],
    );
  }

  async function membroPerAssegnazioneRuolo(membroId) {
    const righe = await query(
      `SELECT m.id, m.nome, m.cognome, m."ruoloMobilityManager",
              a.id AS "accountId", a.stato AS "statoAccount"
       FROM "Membro" m
       JOIN "Account" a ON a.id = m."accountId"
       WHERE m.id = $1`,
      [membroId],
    );
    return righe[0] ?? null;
  }

  async function assegnaRuoloMobilityManager(membroId) {
    const righe = await query(
      `UPDATE "Membro" m SET "ruoloMobilityManager" = TRUE
       FROM "Account" a
       WHERE m.id = $1 AND a.id = m."accountId" AND a.stato = 'Attivo'
       RETURNING m.id, m."ruoloMobilityManager"`,
      [membroId],
    );
    return righe[0] ?? null;
  }

  return {
    cercaOrganizzazioneAttivaPerDominio,
    registraOrganizzazione,
    elencoOrganizzazioni,
    dettaglioOrganizzazione,
    sediOrganizzazione,
    cercaMembri,
    membroPerAssegnazioneRuolo,
    assegnaRuoloMobilityManager,
  };
}

module.exports = creaOperazioniOrganizzazioni;
