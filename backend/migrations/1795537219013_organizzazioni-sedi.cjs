// Migrazione dello schema (livello L1).
// Tabelle, colonne e vincoli come in docs/sdd/CD_persistenza.puml.
// Una migrazione già presente nel main non si modifica: se ne crea una nuova.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('Organizzazione', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    denominazione: { type: 'varchar(200)', notNull: true },
    attiva: { type: 'boolean', notNull: true, default: true },
  });

  pgm.createTable('DominioEmail', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    dominio: { type: 'varchar(254)', notNull: true, unique: true },
    organizzazioneId: {
      type: 'integer',
      notNull: true,
      references: '"Organizzazione"(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.createTable('Sede', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    nome: { type: 'varchar(100)', notNull: true },
    indirizzo: { type: 'varchar(255)', notNull: true },
    organizzazioneId: {
      type: 'integer',
      notNull: true,
      references: '"Organizzazione"(id)',
      onDelete: 'RESTRICT',
    },
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('Sede');
  pgm.dropTable('DominioEmail');
  pgm.dropTable('Organizzazione');
};
