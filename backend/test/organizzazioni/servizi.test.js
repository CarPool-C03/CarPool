const { randomUUID } = require('node:crypto');
const OrganizzazioneService = require('../../src/subsystems/organizzazioni/OrganizzazioneService');
const AccountService = require('../../src/subsystems/account/AccountService');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { creaAccount, eliminaAccount } = require('../auth/fixture');

function dominioNuovo() {
  return `${randomUUID().replace(/-/g, '')}.partner.test`;
}

function datiOrganizzazione(dominio = dominioNuovo()) {
  return {
    denominazione: `Partner ${randomUUID()}`,
    sedi: [{ nome: 'Sede centrale', indirizzo: 'Via di prova, 1' }],
    domini: [dominio],
  };
}

async function eliminaOrganizzazione(id) {
  await PersistenzaService.transazione(async (tx) => {
    await tx.query('DELETE FROM "Sede" WHERE "organizzazioneId" = $1', [id]);
    await tx.query('DELETE FROM "DominioEmail" WHERE "organizzazioneId" = $1', [id]);
    await tx.query('DELETE FROM "Organizzazione" WHERE id = $1', [id]);
  });
}

describe('OrganizzazioneService', () => {
  let account;

  beforeEach(async () => {
    account = await creaAccount();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  afterEach(async () => {
    await eliminaAccount(account);
  });

  test('riconosciDominio: restituisce l’organizzazione attiva del dominio, null altrimenti', async () => {
    const [dominio] = await PersistenzaService.query(
      'SELECT dominio FROM "DominioEmail" WHERE "organizzazioneId" = $1',
      [account.organizzazioneId],
    );
    const trovato = await OrganizzazioneService.riconosciDominio(`Utente@${dominio.dominio.toUpperCase()}`);
    const [organizzazione] = await PersistenzaService.query(
      'SELECT id, denominazione FROM "Organizzazione" WHERE id = $1',
      [account.organizzazioneId],
    );
    await PersistenzaService.query(
      'UPDATE "Organizzazione" SET attiva = FALSE WHERE id = $1',
      [account.organizzazioneId],
    );
    const disattiva = await OrganizzazioneService.riconosciDominio(account.email);
    const sconosciuta = await OrganizzazioneService.riconosciDominio('utente@assente.partner.test');

    expect(trovato).toEqual(organizzazione);
    expect(disattiva).toBeNull();
    expect(sconosciuta).toBeNull();
  });

  test('riconosciDominio: un dominio appena registrato è riconosciuto subito (DG_13)', async () => {
    const dati = datiOrganizzazione();
    const creata = await OrganizzazioneService.registraOrganizzazione(dati);

    try {
      await expect(
        OrganizzazioneService.riconosciDominio(`utente@${dati.domini[0]}`),
      ).resolves.toEqual({ id: creata.id, denominazione: creata.denominazione });
    } finally {
      await eliminaOrganizzazione(creata.id);
    }
  });

  test('Organizzazioni: registra organizzazione, sedi e domini in un’unica transazione', async () => {
    const dati = datiOrganizzazione();
    dati.sedi.push({ nome: 'Sede nord', indirizzo: 'Via di prova, 2' });
    dati.domini.push(dominioNuovo());
    const creata = await OrganizzazioneService.registraOrganizzazione(dati);

    try {
      expect(creata).toMatchObject({
        denominazione: dati.denominazione,
        attiva: true,
        sedi: expect.arrayContaining(dati.sedi.map((sede) => expect.objectContaining(sede))),
        domini: dati.domini,
      });
      expect(creata.sedi).toHaveLength(2);
      expect(creata.domini).toHaveLength(2);
    } finally {
      await eliminaOrganizzazione(creata.id);
    }
  });

  test('Organizzazioni: un dominio già usato da un’altra organizzazione viene rifiutato', async () => {
    const [dominio] = await PersistenzaService.query(
      'SELECT dominio FROM "DominioEmail" WHERE "organizzazioneId" = $1',
      [account.organizzazioneId],
    );
    const dati = datiOrganizzazione(dominio.dominio);

    await expect(OrganizzazioneService.registraOrganizzazione(dati)).rejects.toMatchObject({
      name: 'ErroreValidazione',
      errori: [expect.objectContaining({ campo: 'domini[0]' })],
    });
    const [risultato] = await PersistenzaService.query(
      'SELECT id FROM "Organizzazione" WHERE denominazione = $1',
      [dati.denominazione],
    );
    expect(risultato).toBeUndefined();
  });

  test('Organizzazioni: valida i campi obbligatori e il formato del dominio', async () => {
    await expect(OrganizzazioneService.registraOrganizzazione({
      denominazione: 'Partner non valido',
      sedi: [{ nome: '', indirizzo: 'Via di prova' }],
      domini: ['non-un-dominio'],
    })).rejects.toMatchObject({
      name: 'ErroreValidazione',
      errori: expect.arrayContaining([
        expect.objectContaining({ campo: 'sedi[0].nome' }),
        expect.objectContaining({ campo: 'domini[0]' }),
      ]),
    });
  });

  test('Ruolo MM: assegnato a un Membro attivo', async () => {
    const membro = await AccountService.assegnaRuoloMobilityManager(account.membroId);

    expect(membro).toEqual({ id: account.membroId, ruoloMobilityManager: true });
  });

  test('Ruolo MM: rifiutato per un account non attivo', async () => {
    await PersistenzaService.query(
      'UPDATE "Account" SET stato = $1 WHERE id = $2',
      ['InAttesaDiVerifica', account.id],
    );

    await expect(AccountService.assegnaRuoloMobilityManager(account.membroId))
      .rejects.toMatchObject({ name: 'ErroreConflitto', codice: 'ACCOUNT_NON_ATTIVO' });
  });

  test('Membri: la ricerca richiede almeno tre caratteri', async () => {
    await expect(AccountService.cercaMembri('ab')).rejects.toMatchObject({
      name: 'ErroreValidazione',
      errori: [expect.objectContaining({ campo: 'email' })],
    });
  });
});
