// npm run db:seed: dati di sviluppo e dell'ambiente di test comune (docs/test/ambiente.md).
// I task L1 aggiungono qui i propri dati, sempre tramite PersistenzaService.
require('dotenv').config({ quiet: true });
const PersistenzaService = require('../src/subsystems/persistenza/PersistenzaService');

async function main() {
  await PersistenzaService.query('SELECT 1');
  console.log('Seed completati (nessun dato da inserire per ora).');
}

main()
  .catch((errore) => {
    console.error(`Seed non riusciti: ${errore.message}`);
    process.exitCode = 1;
  })
  .finally(() => PersistenzaService.chiudi());
