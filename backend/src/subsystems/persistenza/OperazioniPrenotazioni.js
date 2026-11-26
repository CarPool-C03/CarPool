function creaOperazioniPrenotazioni({ query, transazione }) {
  const selectRichiesta = `SELECT r.id, r.stato,
      json_build_object(
        'id', v.id,
        'dataOraPartenza', v."dataOraPartenza",
        'puntoPartenza', v."puntoPartenza",
        'sede', CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'nome', s.nome) END,
        'stato', v.stato,
        'conducente', json_build_object('id', c.id, 'nome', c.nome, 'cognome', c.cognome)
      ) AS viaggio
    FROM "RichiestaPrenotazione" r
    JOIN "Viaggio" v ON v.id = r."viaggioId"
    JOIN "Membro" c ON c.id = v."conducenteId"
    LEFT JOIN "Sede" s ON s.id = v."sedeId"`;

  async function dettaglioViaggio(viaggioId, membroId) {
    const righe = await query(
      `SELECT v.id, v."dataOraPartenza", v."puntoPartenza",
              CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'nome', s.nome) END AS sede,
              v."postiOfferti",
              (v."postiOfferti" - COUNT(r.id)::integer) AS "postiDisponibili",
              v."contributoIndicativoEuro"::float8 AS "contributoIndicativoEuro",
              v.stato,
              json_build_object('id', c.id, 'nome', c.nome, 'cognome', c.cognome) AS conducente
       FROM "Viaggio" v
       JOIN "Membro" c ON c.id = v."conducenteId"
       JOIN "Membro" richiedente ON richiedente.id = $2
         AND richiedente."organizzazioneId" = c."organizzazioneId"
       LEFT JOIN "Sede" s ON s.id = v."sedeId"
       LEFT JOIN "RichiestaPrenotazione" r
         ON r."viaggioId" = v.id AND r.stato = 'Accettata'
       WHERE v.id = $1
       GROUP BY v.id, s.id, c.id`,
      [viaggioId, membroId],
    );
    return righe[0] ?? null;
  }

  async function leggiRichiesta(tx, richiestaId) {
    const righe = await tx.query(`${selectRichiesta} WHERE r.id = $1`, [richiestaId]);
    return righe[0] ?? null;
  }

  async function creaRichiesta(membroId, viaggioId) {
    try {
      return await transazione(async (tx) => {
        const viaggi = await tx.query(
          `SELECT v.id, v.stato, v."conducenteId"
           FROM "Viaggio" v
           JOIN "Membro" c ON c.id = v."conducenteId"
           JOIN "Membro" p ON p.id = $1
             AND c."organizzazioneId" = p."organizzazioneId"
           WHERE v.id = $2
           FOR UPDATE OF v`,
          [membroId, viaggioId],
        );
        const viaggio = viaggi[0];
        if (!viaggio) return { errore: 'VIAGGIO_NON_TROVATO' };
        if (viaggio.conducenteId === membroId) return { errore: 'VIAGGIO_PROPRIO' };
        if (viaggio.stato !== 'Attivo') return { errore: 'VIAGGIO_NON_ATTIVO' };

        const richieste = await tx.query(
          `SELECT id FROM "RichiestaPrenotazione"
           WHERE "passeggeroId" = $1 AND "viaggioId" = $2
             AND stato IN ('InAttesa', 'Accettata')`,
          [membroId, viaggioId],
        );
        if (richieste.length) return { errore: 'RICHIESTA_GIA_PRESENTE' };

        const create = await tx.query(
          `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
           VALUES ('InAttesa', $1, $2) RETURNING id`,
          [membroId, viaggioId],
        );
        return { richiesta: await leggiRichiesta(tx, create[0].id) };
      });
    } catch (errore) {
      if (
        errore.code === '23505' &&
        errore.constraint === 'richiesta_prenotazione_attiva_unica'
      ) {
        return { errore: 'RICHIESTA_GIA_PRESENTE' };
      }
      throw errore;
    }
  }

  async function richiesteDelPasseggero(membroId) {
    return query(
      `${selectRichiesta}
       WHERE r."passeggeroId" = $1
       ORDER BY v."dataOraPartenza" DESC, r.id DESC`,
      [membroId],
    );
  }

  async function annullaRichiesta(membroId, richiestaId) {
    return transazione(async (tx) => {
      const righe = await tx.query(
        `SELECT r.id, r.stato AS "statoRichiesta", r."passeggeroId",
                v.stato AS "statoViaggio"
         FROM "RichiestaPrenotazione" r
         JOIN "Viaggio" v ON v.id = r."viaggioId"
         WHERE r.id = $1
         FOR UPDATE OF r, v`,
        [richiestaId],
      );
      const richiesta = righe[0];
      if (!richiesta) return { errore: 'RICHIESTA_NON_TROVATA' };
      if (richiesta.passeggeroId !== membroId) return { errore: 'NON_AUTORIZZATO' };
      if (!['InAttesa', 'Accettata'].includes(richiesta.statoRichiesta)) {
        return { errore: 'RICHIESTA_NON_ANNULLABILE' };
      }
      if (richiesta.statoViaggio === 'Concluso') return { errore: 'VIAGGIO_CONCLUSO' };

      await tx.query(
        `UPDATE "RichiestaPrenotazione" SET stato = 'Annullata' WHERE id = $1`,
        [richiestaId],
      );
      return { richiesta: await leggiRichiesta(tx, richiestaId) };
    });
  }

  async function rispondiRichiesta(membroId, richiestaId, stato) {
    return transazione(async (tx) => {
      const righe = await tx.query(
        `SELECT r.id, r.stato AS "statoRichiesta", r."viaggioId",
                v.stato AS "statoViaggio", v."conducenteId", v."postiOfferti"
         FROM "RichiestaPrenotazione" r
         JOIN "Viaggio" v ON v.id = r."viaggioId"
         WHERE r.id = $1
         FOR UPDATE OF v, r`,
        [richiestaId],
      );
      const richiesta = righe[0];
      if (!richiesta) return { errore: 'RICHIESTA_NON_TROVATA' };
      if (richiesta.conducenteId !== membroId) return { errore: 'NON_AUTORIZZATO' };
      if (richiesta.statoRichiesta !== 'InAttesa') {
        return { errore: 'RICHIESTA_NON_IN_ATTESA' };
      }
      if (richiesta.statoViaggio !== 'Attivo') return { errore: 'VIAGGIO_NON_ATTIVO' };

      if (stato === 'Accettata') {
        const accettate = await tx.query(
          `SELECT COUNT(*)::integer AS totale
           FROM "RichiestaPrenotazione"
           WHERE "viaggioId" = $1 AND stato = 'Accettata'`,
          [richiesta.viaggioId],
        );
        if (accettate[0].totale >= richiesta.postiOfferti) {
          return { errore: 'POSTI_ESAURITI' };
        }
      }

      await tx.query(
        `UPDATE "RichiestaPrenotazione" SET stato = $1
         WHERE id = $2 AND stato = 'InAttesa'`,
        [stato, richiestaId],
      );
      const postiDisponibili = stato === 'Accettata'
        ? (await tx.query(
          `SELECT v."postiOfferti" - COUNT(r.id)::integer AS "postiDisponibili"
           FROM "Viaggio" v
           LEFT JOIN "RichiestaPrenotazione" r
             ON r."viaggioId" = v.id AND r.stato = 'Accettata'
           WHERE v.id = $1
           GROUP BY v.id`,
          [richiesta.viaggioId],
        ))[0].postiDisponibili
        : undefined;

      return {
        id: richiesta.id,
        viaggioId: richiesta.viaggioId,
        stato,
        ...(stato === 'Accettata' ? { postiDisponibili } : {}),
      };
    });
  }

  return {
    dettaglioViaggio,
    creaRichiesta,
    richiesteDelPasseggero,
    annullaRichiesta,
    rispondiRichiesta,
  };
}

module.exports = creaOperazioniPrenotazioni;
