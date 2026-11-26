function creaOperazioniReport({ query }) {
  async function recuperaReportPSCL(sedeId, dal, al) {
    const righe = await query(
      `WITH viaggi AS (
         SELECT to_char(
                  date_trunc('month', v."dataOraPartenza" AT TIME ZONE 'Europe/Rome'),
                  'YYYY-MM'
                ) AS mese,
                v."postiOfferti",
                COUNT(r.id)::integer AS "passeggeriTrasportati"
         FROM "Viaggio" v
         LEFT JOIN "RichiestaPrenotazione" r
           ON r."viaggioId" = v.id AND r.stato = 'Completata'
         WHERE v."sedeId" = $1
           AND v.stato = 'Concluso'
           AND v."dataOraPartenza" >= ($2::date AT TIME ZONE 'Europe/Rome')
           AND v."dataOraPartenza" < (($3::date + INTERVAL '1 day') AT TIME ZONE 'Europe/Rome')
         GROUP BY v.id
       )
       SELECT CASE WHEN GROUPING(mese) = 1 THEN NULL ELSE mese END AS mese,
              COUNT(*)::integer AS "viaggiCondivisi",
              COALESCE(SUM("postiOfferti"), 0)::integer AS "postiOfferti",
              COALESCE(SUM("passeggeriTrasportati"), 0)::integer
                AS "passeggeriTrasportati"
       FROM viaggi
       GROUP BY GROUPING SETS ((mese), ())
       ORDER BY mese NULLS FIRST`,
      [sedeId, dal, al],
    );
    const totale = righe.find((riga) => riga.mese === null);
    const valori = (riga) => ({
      viaggiCondivisi: riga.viaggiCondivisi,
      postiOfferti: riga.postiOfferti,
      passeggeriTrasportati: riga.passeggeriTrasportati,
    });

    return {
      totali: valori(totale),
      mesi: righe
        .filter((riga) => riga.mese !== null)
        .map((riga) => ({ mese: riga.mese, ...valori(riga) })),
    };
  }

  return { recuperaReportPSCL };
}

module.exports = creaOperazioniReport;
