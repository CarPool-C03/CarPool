// Migrazione dello schema (livello L1).
// Tabelle, colonne e vincoli come in docs/sdd/CD_persistenza.puml.
// Una migrazione già presente nel main non si modifica: se ne crea una nuova.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('Evento', {
    id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
    nome: { type: 'varchar(150)', notNull: true },
    dataOraInizio: { type: 'timestamptz', notNull: true },
    luogo: { type: 'varchar(255)', notNull: true },
    organizzazioneId: {
      type: 'integer',
      notNull: true,
      references: '"Organizzazione"(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.createTable(
    'Viaggio',
    {
      id: { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'BY DEFAULT' } },
      dataOraPartenza: { type: 'timestamptz', notNull: true },
      puntoPartenza: { type: 'varchar(255)', notNull: true },
      destinazioneRitorno: { type: 'varchar(255)' },
      postiOfferti: { type: 'integer', notNull: true, check: '"postiOfferti" >= 1' },
      contributoIndicativoEuro: { type: 'numeric(8,2)' },
      stato: {
        type: 'varchar(20)',
        notNull: true,
        default: 'Attivo',
        check: "stato IN ('Attivo', 'Cancellato', 'Concluso')",
      },
      direzioneEvento: {
        type: 'varchar(20)',
        check: '"direzioneEvento" IN (\'Andata\', \'Ritorno\')',
      },
      conducenteId: {
        type: 'integer',
        notNull: true,
        references: '"Membro"(id)',
        onDelete: 'RESTRICT',
      },
      sedeId: {
        type: 'integer',
        references: '"Sede"(id)',
        onDelete: 'RESTRICT',
      },
      eventoId: {
        type: 'integer',
        references: '"Evento"(id)',
        onDelete: 'RESTRICT',
      },
    },
    {
      constraints: {
        check: [
          '("sedeId" IS NOT NULL AND "eventoId" IS NULL) OR ("sedeId" IS NULL AND "eventoId" IS NOT NULL)',
          '"eventoId" IS NOT NULL OR ("direzioneEvento" IS NULL AND "destinazioneRitorno" IS NULL)',
        ],
      },
    },
  );

  pgm.createIndex('Viaggio', ['stato', 'dataOraPartenza', 'sedeId'], {
    name: 'viaggio_ricerca_idx',
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('Viaggio');
  pgm.dropTable('Evento');
};
