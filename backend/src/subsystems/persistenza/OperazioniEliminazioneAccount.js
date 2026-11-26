function creaOperazioniEliminazioneAccount({ transazione }) {
  async function eliminaAccount(accountId) {
    return transazione(async (tx) => {
      const accounts = await tx.query(
        'SELECT id, stato FROM "Account" WHERE id = $1 FOR UPDATE',
        [accountId],
      );
      if (!accounts[0] || accounts[0].stato !== 'Attivo') {
        throw new Error('Account non attivo durante la cancellazione');
      }

      const membri = await tx.query(
        'SELECT id FROM "Membro" WHERE "accountId" = $1 FOR UPDATE',
        [accountId],
      );
      if (!membri[0]) throw new Error('Membro non trovato durante la cancellazione');
      const membroId = membri[0].id;

      await tx.query('DELETE FROM "Veicolo" WHERE "membroId" = $1', [membroId]);
      await tx.query('DELETE FROM "Messaggio" WHERE "mittenteId" = $1', [membroId]);
      await tx.query(
        'DELETE FROM "Valutazione" WHERE "autoreId" = $1 OR "valutatoId" = $1',
        [membroId],
      );

      const viaggi = await tx.query(
        `UPDATE "Viaggio" SET stato = 'Cancellato'
         WHERE "conducenteId" = $1 AND stato = 'Attivo'
         RETURNING id`,
        [membroId],
      );
      await tx.query(
        `UPDATE "RichiestaPrenotazione" SET stato = 'Annullata'
         WHERE stato IN ('InAttesa', 'Accettata')
           AND ("passeggeroId" = $1 OR "viaggioId" = ANY($2::integer[]))`,
        [membroId, viaggi.map(({ id }) => id)],
      );

      await tx.query(
        `UPDATE "Account"
         SET stato = 'Eliminato', email = 'eliminato+' || id::text || '@anonimo.invalid'
         WHERE id = $1`,
        [accountId],
      );
      await tx.query(
        `UPDATE "Membro"
         SET nome = 'Utente', cognome = 'Eliminato', "ruoloMobilityManager" = FALSE
         WHERE id = $1`,
        [membroId],
      );
      await tx.query('DELETE FROM "Sessione" WHERE "accountId" = $1', [accountId]);
    });
  }

  return { eliminaAccount };
}

module.exports = creaOperazioniEliminazioneAccount;
