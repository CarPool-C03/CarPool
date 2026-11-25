const { randomUUID } = require('node:crypto');
const PersistenzaService = require('../src/subsystems/persistenza/PersistenzaService');
const { creaAccount, eliminaAccount } = require('./auth/fixture');

describe('Persistenza account', () => {
  let account;
  const accountAggiuntivi = [];

  beforeEach(async () => {
    account = await creaAccount();
    accountAggiuntivi.length = 0;
  });

  afterEach(async () => {
    for (const aggiuntivo of accountAggiuntivi) {
      await eliminaAccount(aggiuntivo);
    }
    await eliminaAccount(account);
  });

  test('Persistenza: trovaAccountPerEmail restituisce id, passwordHash e stato', async () => {
    const risultato = await PersistenzaService.trovaAccountPerEmail(account.email);

    expect(risultato).toEqual({
      id: account.id,
      passwordHash: expect.any(String),
      stato: 'Attivo',
    });
  });

  test("Persistenza: trovaAccountPerEmail restituisce null per un'e-mail inesistente", async () => {
    const risultato = await PersistenzaService.trovaAccountPerEmail(
      `assente-${randomUUID()}@test.local`,
    );

    expect(risultato).toBeNull();
  });

  test('Persistenza: recuperaUtenteCorrente restituisce Membro e organizzazione', async () => {
    const risultato = await PersistenzaService.recuperaUtenteCorrente(account.id);

    expect(risultato).toMatchObject({
      membroId: account.membroId,
      nome: 'Utente',
      cognome: 'Test',
      tipoAccount: 'Membro',
      organizzazioneId: account.organizzazioneId,
      denominazione: expect.any(String),
    });
  });

  test("Persistenza: recuperaUtenteCorrente restituisce membroId null per l'Amministratore", async () => {
    const amministratore = await creaAccount({ tipoAccount: 'Amministratore' });
    accountAggiuntivi.push(amministratore);

    const risultato = await PersistenzaService.recuperaUtenteCorrente(amministratore.id);

    expect(risultato).toMatchObject({
      tipoAccount: 'Amministratore',
      membroId: null,
      organizzazioneId: null,
    });
  });

  test('Persistenza: recuperaUtenteCorrente restituisce null per un account non Attivo', async () => {
    const nonAttivo = await creaAccount({ stato: 'InAttesaDiVerifica' });
    accountAggiuntivi.push(nonAttivo);

    await expect(
      PersistenzaService.recuperaUtenteCorrente(nonAttivo.id),
    ).resolves.toBeNull();
  });
});
