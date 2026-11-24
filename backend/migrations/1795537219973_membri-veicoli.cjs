// Migrazione dello schema (livello L1).
// Tabelle, colonne e vincoli come in docs/sdd/CD_persistenza.puml.
// Una migrazione già presente nel main non si modifica: se ne crea una nuova.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('Membro', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    nome: { type: 'varchar(100)', notNull: true },
    cognome: { type: 'varchar(100)', notNull: true },
    ruoloMobilityManager: { type: 'boolean', notNull: true, default: false },
    accountId: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: '"Account"(id)',
      onDelete: 'RESTRICT',
    },
    organizzazioneId: {
      type: 'integer',
      notNull: true,
      references: '"Organizzazione"(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.createTable('Veicolo', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    modello: { type: 'varchar(100)', notNull: true },
    colore: { type: 'varchar(50)', notNull: true },
    numeroPostiPasseggeri: {
      type: 'integer',
      notNull: true,
      check: '"numeroPostiPasseggeri" >= 1',
    },
    membroId: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: '"Membro"(id)',
      onDelete: 'RESTRICT',
    },
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('Veicolo');
  pgm.dropTable('Membro');
};
