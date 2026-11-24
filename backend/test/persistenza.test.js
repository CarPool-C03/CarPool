const PersistenzaService = require('../src/subsystems/persistenza/PersistenzaService');

// Tabella usata solo da questi test, creata e cancellata qui.
const TABELLA = 'prova_persistenza';

async function contaRighe() {
  const righe = await PersistenzaService.query(`SELECT COUNT(*)::int AS n FROM ${TABELLA}`);
  return righe[0].n;
}

describe('Persistenza', () => {
  beforeAll(async () => {
    await PersistenzaService.query(
      `CREATE TABLE IF NOT EXISTS ${TABELLA} (id SERIAL PRIMARY KEY, nome TEXT NOT NULL)`,
    );
  });

  beforeEach(async () => {
    await PersistenzaService.query(`TRUNCATE ${TABELLA}`);
  });

  afterAll(async () => {
    await PersistenzaService.query(`DROP TABLE IF EXISTS ${TABELLA}`);
    await PersistenzaService.chiudi();
  });

  test('Persistenza: query esegue SELECT 1 sul database di test', async () => {
    const righe = await PersistenzaService.query('SELECT 1 AS valore');

    expect(righe).toEqual([{ valore: 1 }]);
  });

  test('Persistenza: transazione esegue il commit se fn termina senza errori', async () => {
    const risultato = await PersistenzaService.transazione(async (tx) => {
      await tx.query(`INSERT INTO ${TABELLA} (nome) VALUES ($1)`, ['Luca']);
      return 'fatto';
    });

    expect(risultato).toBe('fatto');
    expect(await contaRighe()).toBe(1);
  });

  test('Persistenza: transazione esegue il rollback se fn lancia un errore', async () => {
    const operazione = PersistenzaService.transazione(async (tx) => {
      await tx.query(`INSERT INTO ${TABELLA} (nome) VALUES ($1)`, ['Anna']);
      throw new Error('errore simulato');
    });

    await expect(operazione).rejects.toThrow('errore simulato');
    expect(await contaRighe()).toBe(0);
  });
});
