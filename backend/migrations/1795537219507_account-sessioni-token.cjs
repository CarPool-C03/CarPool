// Migrazione dello schema (livello L1).
// Tabelle, colonne e vincoli come in docs/sdd/CD_persistenza.puml.
// Una migrazione già presente nel main non si modifica: se ne crea una nuova.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('Account', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    email: { type: 'varchar(254)', notNull: true, unique: true },
    passwordHash: { type: 'varchar(255)', notNull: true },
    tipoAccount: {
      type: 'varchar(30)',
      notNull: true,
      check: '"tipoAccount" IN (\'Membro\', \'Amministratore\')',
    },
    stato: {
      type: 'varchar(30)',
      notNull: true,
      default: 'InAttesaDiVerifica',
      check: "stato IN ('InAttesaDiVerifica', 'Attivo', 'Eliminato')",
    },
  });

  pgm.createTable('Sessione', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    hashToken: { type: 'varchar(255)', notNull: true, unique: true },
    ultimaAttivita: { type: 'timestamptz', notNull: true },
    accountId: {
      type: 'integer',
      notNull: true,
      references: '"Account"(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.createTable('TokenVerifica', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    tipo: {
      type: 'varchar(30)',
      notNull: true,
      check: "tipo IN ('VerificaEmail', 'RecuperoCredenziali')",
    },
    hashToken: { type: 'varchar(255)', notNull: true, unique: true },
    scadenza: { type: 'timestamptz', notNull: true },
    usatoIl: { type: 'timestamptz' },
    accountId: {
      type: 'integer',
      notNull: true,
      references: '"Account"(id)',
      onDelete: 'RESTRICT',
    },
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('TokenVerifica');
  pgm.dropTable('Sessione');
  pgm.dropTable('Account');
};
