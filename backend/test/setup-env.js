// Eseguito da Jest prima di ogni file di test.
// In locale: legge .env e usa il database di test (TEST_DATABASE_URL), mai quello di sviluppo.
// In CI: .env non esiste e DATABASE_URL è già quella del database di test.
require('dotenv').config({ quiet: true });

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
