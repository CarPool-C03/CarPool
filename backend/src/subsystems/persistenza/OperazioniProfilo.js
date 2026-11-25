function creaOperazioniProfilo({ query }) {
  async function recuperaProfilo(membroId) {
    const righe = await query(
      `SELECT m.nome, m.cognome, a.email,
              json_build_object('id', o.id, 'denominazione', o.denominazione) AS organizzazione,
              m."ruoloMobilityManager",
              CASE WHEN v.id IS NULL THEN NULL
                ELSE json_build_object(
                  'id', v.id,
                  'modello', v.modello,
                  'colore', v.colore,
                  'numeroPostiPasseggeri', v."numeroPostiPasseggeri"
                )
              END AS veicolo
       FROM "Membro" m
       JOIN "Account" a ON a.id = m."accountId"
       JOIN "Organizzazione" o ON o.id = m."organizzazioneId"
       LEFT JOIN "Veicolo" v ON v."membroId" = m.id
       WHERE m.id = $1 AND a.stato = 'Attivo'`,
      [membroId],
    );
    return righe[0] ?? null;
  }

  async function inserisciVeicolo(membroId, { modello, colore, numeroPostiPasseggeri }) {
    const righe = await query(
      `INSERT INTO "Veicolo" (modello, colore, "numeroPostiPasseggeri", "membroId")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("membroId") DO NOTHING
       RETURNING id, modello, colore, "numeroPostiPasseggeri"`,
      [modello, colore, numeroPostiPasseggeri, membroId],
    );
    return righe[0] ?? null;
  }

  async function calcolaValutazioneMedia(membroId) {
    const righe = await query(
      `SELECT ROUND(AVG(punteggio)::numeric, 2) AS media
       FROM "Valutazione" WHERE "valutatoId" = $1`,
      [membroId],
    );
    return righe[0].media === null ? null : Number(righe[0].media);
  }

  return { recuperaProfilo, inserisciVeicolo, calcolaValutazioneMedia };
}

module.exports = creaOperazioniProfilo;
