// Migrazione dello schema (livello L1).
// Tabelle, colonne e vincoli come in docs/sdd/CD_persistenza.puml.
// Una migrazione già presente nel main non si modifica: se ne crea una nuova.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createIndex('Sessione', 'accountId', { name: 'sessione_account_idx' });
  pgm.createIndex('TokenVerifica', 'accountId', { name: 'token_verifica_account_idx' });
  pgm.addConstraint('Account', 'account_email_minuscola', {
    check: 'email = lower(email)',
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropConstraint('Account', 'account_email_minuscola');
  pgm.dropIndex('TokenVerifica', 'accountId', { name: 'token_verifica_account_idx' });
  pgm.dropIndex('Sessione', 'accountId', { name: 'sessione_account_idx' });
};
