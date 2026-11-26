const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD } = require('../auth/fixture');

const ISTANTE_FISSATO = '2026-12-01T10:00:00+01:00';
const DENOMINAZIONE_ORGANIZZAZIONE = 'Università degli Studi di Salerno';
const DOMINIO_EMAIL = 'studenti.unisa.it';
const VEICOLO = {
  modello: 'Fiat Panda',
  colore: 'Bianco',
  numeroPostiPasseggeri: 4,
};

function fissaOrologio() {
  jest.useFakeTimers({
    doNotFake: [
      'nextTick',
      'setImmediate',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'queueMicrotask',
      'performance',
      'hrtime',
    ],
  });
  jest.setSystemTime(new Date(ISTANTE_FISSATO));
}

function ripristinaOrologio() {
  jest.useRealTimers();
}

async function login(account) {
  const risposta = await request(creaApp())
    .post('/api/auth/login')
    .send({ email: account.email, password: PASSWORD });
  return risposta.headers['set-cookie'][0].split(';')[0];
}

async function preparaOrganizzazioneTCS() {
  return PersistenzaService.transazione(async (tx) => {
    const [esistente] = await tx.query(
      `SELECT o.id, o.denominazione
       FROM "DominioEmail" d
       JOIN "Organizzazione" o ON o.id = d."organizzazioneId"
       WHERE d.dominio = $1`,
      [DOMINIO_EMAIL],
    );
    if (esistente) {
      if (esistente.denominazione !== DENOMINAZIONE_ORGANIZZAZIONE) {
        throw new Error(`Il dominio ${DOMINIO_EMAIL} appartiene a un'organizzazione inattesa`);
      }
      return { organizzazioneId: esistente.id, creataDaFixture: false };
    }
    const [organizzazione] = await tx.query(
      'INSERT INTO "Organizzazione" (denominazione) VALUES ($1) RETURNING id',
      [DENOMINAZIONE_ORGANIZZAZIONE],
    );
    await tx.query(
      'INSERT INTO "DominioEmail" (dominio, "organizzazioneId") VALUES ($1, $2)',
      [DOMINIO_EMAIL, organizzazione.id],
    );
    return { organizzazioneId: organizzazione.id, creataDaFixture: true };
  });
}

async function creaAccountTCS(nome, cognome, organizzazioneId) {
  const suffisso = randomUUID();
  const email = `${nome.toLowerCase()}.${cognome.toLowerCase()}+${suffisso}@${DOMINIO_EMAIL}`;
  return PersistenzaService.transazione(async (tx) => {
    const [account] = await tx.query(
      `INSERT INTO "Account" (email, "passwordHash", "tipoAccount", stato)
       VALUES ($1, $2, 'Membro', 'Attivo') RETURNING id`,
      [email, await bcrypt.hash(PASSWORD, 4)],
    );
    const [membro] = await tx.query(
      `INSERT INTO "Membro" (nome, cognome, "accountId", "organizzazioneId")
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nome, cognome, account.id, organizzazioneId],
    );
    return { ...account, email, organizzazioneId, membroId: membro.id };
  });
}

async function creaContesto() {
  const organizzazione = await preparaOrganizzazioneTCS();
  const passeggero = await creaAccountTCS('Anna', 'Bianchi', organizzazione.organizzazioneId);
  const conducente = await creaAccountTCS('Luca', 'Verdi', organizzazione.organizzazioneId);
  const altroPasseggero = await creaAccountTCS('Marco', 'Russo', organizzazione.organizzazioneId);
  const [sede] = await PersistenzaService.query(
    `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
     VALUES ($1, 'Via di prova, 1', $2) RETURNING id, nome`,
    ['Campus di Fisciano', passeggero.organizzazioneId],
  );
  await PersistenzaService.inserisciVeicolo(conducente.membroId, VEICOLO);
  return {
    passeggero,
    conducente,
    altroPasseggero,
    cookie: await login(passeggero),
    cookieAltroPasseggero: await login(altroPasseggero),
    cookieConducente: await login(conducente),
    sede,
    viaggiId: [],
    accounts: [passeggero, conducente, altroPasseggero],
    organizzazioneId: organizzazione.organizzazioneId,
    organizzazioneCreataDaFixture: organizzazione.creataDaFixture,
  };
}

async function aggiungiPasseggero(contesto) {
  const account = await creaAccountTCS(
    'Passeggero',
    `Aggiuntivo${randomUUID().replaceAll('-', '')}`,
    contesto.organizzazioneId,
  );
  contesto.accounts.push(account);
  return account;
}

async function creaViaggio(contesto, opzioni = {}) {
  const {
    conducenteId = contesto.conducente.membroId,
    dataOraPartenza = '2026-12-03T08:00:00+01:00',
    postiOfferti = 3,
    stato = 'Attivo',
  } = opzioni;
  const [viaggio] = await PersistenzaService.query(
    `INSERT INTO "Viaggio"
      ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
     VALUES ($1, 'Salerno, Piazza della Concordia', $2, $3, $4, $5) RETURNING id`,
    [dataOraPartenza, postiOfferti, stato, conducenteId, contesto.sede.id],
  );
  contesto.viaggiId.push(viaggio.id);
  return viaggio.id;
}

async function creaRichiesta(viaggioId, passeggeroId, stato = 'InAttesa') {
  const [richiesta] = await PersistenzaService.query(
    `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
     VALUES ($1, $2, $3) RETURNING id`,
    [stato, passeggeroId, viaggioId],
  );
  return richiesta.id;
}

async function pulisciContesto(contesto) {
  await PersistenzaService.transazione(async (tx) => {
    if (contesto.viaggiId.length) {
      await tx.query(
        'DELETE FROM "RichiestaPrenotazione" WHERE "viaggioId" = ANY($1::integer[])',
        [contesto.viaggiId],
      );
      await tx.query('DELETE FROM "Viaggio" WHERE id = ANY($1::integer[])', [contesto.viaggiId]);
    }
    await tx.query('DELETE FROM "Veicolo" WHERE "membroId" = $1', [
      contesto.conducente.membroId,
    ]);
    await tx.query('DELETE FROM "Sede" WHERE id = $1', [contesto.sede.id]);
    for (const account of [...contesto.accounts].reverse()) {
      await tx.query('DELETE FROM "Sessione" WHERE "accountId" = $1', [account.id]);
      await tx.query('DELETE FROM "Membro" WHERE "accountId" = $1', [account.id]);
      await tx.query('DELETE FROM "Account" WHERE id = $1', [account.id]);
    }
    if (contesto.organizzazioneCreataDaFixture) {
      const [riferimenti] = await tx.query(
        `SELECT EXISTS (
           SELECT 1 FROM "Membro" WHERE "organizzazioneId" = $1
         ) OR EXISTS (
           SELECT 1 FROM "Sede" WHERE "organizzazioneId" = $1
         ) AS inUso`,
        [contesto.organizzazioneId],
      );
      if (!riferimenti.inuso) {
        await tx.query(
          'DELETE FROM "DominioEmail" WHERE dominio = $1 AND "organizzazioneId" = $2',
          [DOMINIO_EMAIL, contesto.organizzazioneId],
        );
        await tx.query('DELETE FROM "Organizzazione" WHERE id = $1', [
          contesto.organizzazioneId,
        ]);
      }
    }
  });
}

module.exports = {
  fissaOrologio,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  aggiungiPasseggero,
  pulisciContesto,
  ripristinaOrologio,
};
