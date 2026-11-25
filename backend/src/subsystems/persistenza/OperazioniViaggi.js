function creaOperazioniViaggi({ query }) {
  async function inserisciViaggio(dati) {
    const righe = await query(
      `INSERT INTO "Viaggio"
        ("dataOraPartenza", "puntoPartenza", "postiOfferti",
         "contributoIndicativoEuro", stato, "conducenteId", "sedeId", "eventoId")
       VALUES ($1, $2, $3, $4, 'Attivo', $5, $6, NULL)
       RETURNING id`,
      [
        dati.dataOraPartenza,
        dati.puntoPartenza,
        dati.postiOfferti,
        dati.contributoIndicativoEuro,
        dati.conducenteId,
        dati.sedeId,
      ],
    );
    if (!righe[0]) return null;
    return dettaglioViaggio(righe[0].id, dati.conducenteId);
  }

  async function dettaglioViaggio(viaggioId, membroId) {
    const righe = await query(
      `SELECT v.id, v."dataOraPartenza", v."puntoPartenza",
              json_build_object('id', s.id, 'nome', s.nome) AS sede,
              v."postiOfferti",
              (v."postiOfferti" - COUNT(r.id) FILTER (WHERE r.stato = 'Accettata')::integer)
                AS "postiDisponibili",
              v."contributoIndicativoEuro"::float8 AS "contributoIndicativoEuro",
              v.stato,
              json_build_object('id', c.id, 'nome', c.nome, 'cognome', c.cognome)
                AS conducente
       FROM "Viaggio" v
       JOIN "Sede" s ON s.id = v."sedeId"
       JOIN "Membro" c ON c.id = v."conducenteId"
       LEFT JOIN "RichiestaPrenotazione" r ON r."viaggioId" = v.id
       WHERE v.id = $1
         AND c."organizzazioneId" = (
           SELECT m."organizzazioneId" FROM "Membro" m WHERE m.id = $2
         )
       GROUP BY v.id, s.id, c.id`,
      [viaggioId, membroId],
    );
    return righe[0] ?? null;
  }

  return { inserisciViaggio, dettaglioViaggio };
}

module.exports = creaOperazioniViaggi;
