function creaOperazioniConclusioneViaggi({ transazione }) {
  async function concludiViaggiScaduti(limite) {
    return transazione(async (tx) => {
      const viaggi = await tx.query(
        `UPDATE "Viaggio"
         SET stato = 'Concluso'
         WHERE stato = 'Attivo' AND "dataOraPartenza" < $1
         RETURNING id`,
        [limite],
      );
      if (viaggi.length === 0) return 0;

      await tx.query(
        `UPDATE "RichiestaPrenotazione"
         SET stato = 'Completata'
         WHERE stato = 'Accettata' AND "viaggioId" = ANY($1::integer[])`,
        [viaggi.map(({ id }) => id)],
      );
      return viaggi.length;
    });
  }

  return { concludiViaggiScaduti };
}

module.exports = creaOperazioniConclusioneViaggi;
