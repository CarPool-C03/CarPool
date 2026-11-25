// Allinea i limiti delle sedi al contratto API di registrazione organizzazioni.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.alterColumn('Sede', 'nome', { type: 'varchar(200)' });
  pgm.alterColumn('Sede', 'indirizzo', { type: 'varchar(300)' });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.alterColumn('Sede', 'nome', { type: 'varchar(100)' });
  pgm.alterColumn('Sede', 'indirizzo', { type: 'varchar(255)' });
};
