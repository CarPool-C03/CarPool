function creaOperazioniValutazioni({ query }) {
  async function viaggioPerValutazione(viaggioId) {
    const righe = await query(
      'SELECT id, stato FROM "Viaggio" WHERE id = $1',
      [viaggioId],
    );
    return righe[0] ?? null;
  }

  async function esisteValutazione(autoreId, valutatoId, viaggioId) {
    const righe = await query(
      `SELECT EXISTS (
         SELECT 1 FROM "Valutazione"
         WHERE "autoreId" = $1 AND "valutatoId" = $2 AND "viaggioId" = $3
       ) AS presente`,
      [autoreId, valutatoId, viaggioId],
    );
    return righe[0].presente;
  }

  async function inserisciValutazione({ autoreId, viaggioId, valutatoId, punteggio, commento }) {
    const righe = await query(
      `INSERT INTO "Valutazione"
        ("autoreId", "viaggioId", "valutatoId", punteggio, commento)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("autoreId", "valutatoId", "viaggioId") DO NOTHING
       RETURNING id, punteggio, commento`,
      [autoreId, viaggioId, valutatoId, punteggio, commento],
    );
    return righe[0] ?? null;
  }

  async function valutazioniDaFare(membroId) {
    return query(
      `SELECT v.id AS "viaggioId", v."dataOraPartenza",
              CASE WHEN s.id IS NULL THEN NULL
                ELSE json_build_object('id', s.id, 'nome', s.nome)
              END AS sede,
              valutato.id AS "membroId", valutato.nome, valutato.cognome,
              CASE WHEN v."conducenteId" = $1 THEN 'Passeggero'
                ELSE 'Conducente'
              END AS ruolo
       FROM "Viaggio" v
       JOIN "RichiestaPrenotazione" r
         ON r."viaggioId" = v.id AND r.stato = 'Completata'
       JOIN "Membro" valutato
         ON (v."conducenteId" = $1 AND valutato.id = r."passeggeroId")
         OR (r."passeggeroId" = $1 AND valutato.id = v."conducenteId")
       LEFT JOIN "Sede" s ON s.id = v."sedeId"
       WHERE v.stato = 'Concluso'
         AND (v."conducenteId" = $1 OR r."passeggeroId" = $1)
         AND NOT EXISTS (
           SELECT 1 FROM "Valutazione" val
           WHERE val."autoreId" = $1
             AND val."valutatoId" = valutato.id
             AND val."viaggioId" = v.id
         )
       ORDER BY v."dataOraPartenza" DESC, v.id DESC, valutato.id`,
      [membroId],
    );
  }

  return {
    viaggioPerValutazione,
    esisteValutazione,
    inserisciValutazione,
    valutazioniDaFare,
  };
}

module.exports = creaOperazioniValutazioni;
