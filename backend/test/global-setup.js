// Eseguito da Jest una volta, prima di tutti i test: porta il database di test
// all'ultima migrazione di backend/migrations/, in locale come in CI.
const path = require('node:path');
require('./setup-env');

module.exports = async () => {
  const { runner } = await import('node-pg-migrate');
  await runner({
    databaseUrl: process.env.DATABASE_URL,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => {},
  });
};
