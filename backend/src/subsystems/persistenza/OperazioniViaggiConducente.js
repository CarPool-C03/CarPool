function creaOperazioniViaggiConducente({ query, transazione }) {
  async function viaggioConRichieste(tx, viaggioId) {
    const righe = await tx.query(
      `SELECT v.id, v."dataOraPartenza", v."puntoPartenza",
              json_build_object('id', s.id, 'nome', s.nome) AS sede,
              v."postiOfferti",
              (v."postiOfferti" - COUNT(r.id) FILTER (WHERE r.stato = 'Accettata')::integer)
                AS "postiDisponibili",
              v."contributoIndicativoEuro"::float8 AS "contributoIndicativoEuro",
              v.stato,
              json_build_object('id', c.id, 'nome', c.nome, 'cognome', c.cognome) AS conducente,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', r.id,
                    'stato', r.stato,
                    'passeggero', json_build_object(
                      'id', p.id, 'nome', p.nome, 'cognome', p.cognome
                    )
                  ) ORDER BY r.id
                ) FILTER (WHERE r.id IS NOT NULL),
                '[]'::json
              ) AS richieste
       FROM "Viaggio" v
       JOIN "Sede" s ON s.id = v."sedeId"
       JOIN "Membro" c ON c.id = v."conducenteId"
       LEFT JOIN "RichiestaPrenotazione" r ON r."viaggioId" = v.id
       LEFT JOIN "Membro" p ON p.id = r."passeggeroId"
       WHERE v.id = $1
       GROUP BY v.id, s.id, c.id`,
      [viaggioId],
    );
    return righe[0] ?? null;
  }

  async function recuperaViaggiDelConducente(membroId) {
    const righe = await query(
      `SELECT v.id, v."dataOraPartenza", v."puntoPartenza",
              json_build_object('id', s.id, 'nome', s.nome) AS sede,
              v."postiOfferti",
              (v."postiOfferti" - COUNT(r.id) FILTER (WHERE r.stato = 'Accettata')::integer)
                AS "postiDisponibili",
              v."contributoIndicativoEuro"::float8 AS "contributoIndicativoEuro",
              v.stato,
              json_build_object('id', c.id, 'nome', c.nome, 'cognome', c.cognome) AS conducente,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', r.id,
                    'stato', r.stato,
                    'passeggero', json_build_object(
                      'id', p.id, 'nome', p.nome, 'cognome', p.cognome
                    )
                  ) ORDER BY r.id
                ) FILTER (WHERE r.id IS NOT NULL),
                '[]'::json
              ) AS richieste
       FROM "Viaggio" v
       JOIN "Sede" s ON s.id = v."sedeId"
       JOIN "Membro" c ON c.id = v."conducenteId"
       LEFT JOIN "RichiestaPrenotazione" r ON r."viaggioId" = v.id
       LEFT JOIN "Membro" p ON p.id = r."passeggeroId"
       WHERE v."conducenteId" = $1 AND v.stato IN ('Attivo', 'Concluso')
       GROUP BY v.id, s.id, c.id
       ORDER BY CASE WHEN v.stato = 'Attivo' THEN 0 ELSE 1 END,
                CASE WHEN v.stato = 'Attivo' THEN v."dataOraPartenza" END ASC,
                CASE WHEN v.stato = 'Concluso' THEN v."dataOraPartenza" END DESC`,
      [membroId],
    );
    return {
      attivi: righe.filter((viaggio) => viaggio.stato === 'Attivo'),
      conclusi: righe.filter((viaggio) => viaggio.stato === 'Concluso'),
    };
  }

  async function modificaViaggio(membroId, viaggioId, dati) {
    return transazione(async (tx) => {
      const righe = await tx.query(
        `SELECT id, stato, "conducenteId"
         FROM "Viaggio" WHERE id = $1 FOR UPDATE`,
        [viaggioId],
      );
      const viaggio = righe[0];
      if (!viaggio) return { esito: 'NON_TROVATO' };
      if (viaggio.conducenteId !== membroId) return { esito: 'NON_PROPRIETARIO' };
      if (viaggio.stato !== 'Attivo') return { esito: 'NON_ATTIVO' };

      const accettate = await tx.query(
        `SELECT id FROM "RichiestaPrenotazione"
         WHERE "viaggioId" = $1 AND stato = 'Accettata' LIMIT 1`,
        [viaggioId],
      );
      if (accettate.length) return { esito: 'RICHIESTE_ACCETTATE' };

      await tx.query(
        `UPDATE "Viaggio"
         SET "dataOraPartenza" = $1, "puntoPartenza" = $2, "postiOfferti" = $3,
             "contributoIndicativoEuro" = $4, "sedeId" = $5
         WHERE id = $6`,
        [
          dati.dataOraPartenza,
          dati.puntoPartenza,
          dati.postiOfferti,
          dati.contributoIndicativoEuro,
          dati.sedeId,
          viaggioId,
        ],
      );
      const aggiornato = await viaggioConRichieste(tx, viaggioId);
      return {
        esito: 'AGGIORNATO',
        viaggio: aggiornato,
        richiesteInAttesaIds: aggiornato.richieste
          .filter((richiesta) => richiesta.stato === 'InAttesa')
          .map((richiesta) => richiesta.id),
      };
    });
  }

  async function cancellaViaggio(membroId, viaggioId) {
    return transazione(async (tx) => {
      const righe = await tx.query(
        `SELECT id, stato, "conducenteId"
         FROM "Viaggio" WHERE id = $1 FOR UPDATE`,
        [viaggioId],
      );
      const viaggio = righe[0];
      if (!viaggio) return { esito: 'NON_TROVATO' };
      if (viaggio.conducenteId !== membroId) return { esito: 'NON_PROPRIETARIO' };
      if (viaggio.stato !== 'Attivo') return { esito: 'NON_ATTIVO' };

      const richieste = await tx.query(
        `UPDATE "RichiestaPrenotazione"
         SET stato = 'Annullata'
         WHERE "viaggioId" = $1 AND stato IN ('InAttesa', 'Accettata')
         RETURNING id`,
        [viaggioId],
      );
      await tx.query(
        `UPDATE "Viaggio" SET stato = 'Cancellato' WHERE id = $1`,
        [viaggioId],
      );
      const aggiornato = await viaggioConRichieste(tx, viaggioId);
      return {
        esito: 'CANCELLATO',
        viaggio: aggiornato,
        richiesteAnnullateIds: richieste.map((richiesta) => richiesta.id),
      };
    });
  }

  return {
    recuperaViaggiDelConducente,
    modificaViaggio,
    cancellaViaggio,
  };
}

module.exports = creaOperazioniViaggiConducente;
