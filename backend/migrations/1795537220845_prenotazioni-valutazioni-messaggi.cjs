// Migrazione dello schema (livello L1).
// Tabelle, colonne e vincoli come in docs/sdd/CD_persistenza.puml.
// Una migrazione già presente nel main non si modifica: se ne crea una nuova.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('RichiestaPrenotazione', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    stato: {
      type: 'varchar(20)',
      notNull: true,
      default: 'InAttesa',
      check: "stato IN ('InAttesa', 'Accettata', 'Rifiutata', 'Annullata', 'Completata')",
    },
    passeggeroId: {
      type: 'integer',
      notNull: true,
      references: '"Membro"(id)',
      onDelete: 'RESTRICT',
    },
    viaggioId: {
      type: 'integer',
      notNull: true,
      references: '"Viaggio"(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.createIndex('RichiestaPrenotazione', ['passeggeroId', 'viaggioId'], {
    name: 'richiesta_prenotazione_attiva_unica',
    unique: true,
    where: '"stato" IN (\'InAttesa\', \'Accettata\')',
  });

  pgm.createTable(
    'Valutazione',
    {
      id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
      punteggio: { type: 'smallint', notNull: true, check: 'punteggio BETWEEN 1 AND 5' },
      commento: { type: 'text' },
      autoreId: {
        type: 'integer',
        notNull: true,
        references: '"Membro"(id)',
        onDelete: 'RESTRICT',
      },
      valutatoId: {
        type: 'integer',
        notNull: true,
        references: '"Membro"(id)',
        onDelete: 'RESTRICT',
      },
      viaggioId: {
        type: 'integer',
        notNull: true,
        references: '"Viaggio"(id)',
        onDelete: 'RESTRICT',
      },
    },
    { constraints: { unique: [['autoreId', 'valutatoId', 'viaggioId']] } },
  );

  pgm.createTable('Messaggio', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    testo: { type: 'text', notNull: true },
    dataOraInvio: { type: 'timestamptz', notNull: true },
    mittenteId: {
      type: 'integer',
      notNull: true,
      references: '"Membro"(id)',
      onDelete: 'RESTRICT',
    },
    viaggioId: {
      type: 'integer',
      notNull: true,
      references: '"Viaggio"(id)',
      onDelete: 'RESTRICT',
    },
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('Messaggio');
  pgm.dropTable('Valutazione');
  pgm.dropTable('RichiestaPrenotazione');
};
