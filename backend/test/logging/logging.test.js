const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const request = require('supertest');

const directoryLog = fs.mkdtempSync(path.join(os.tmpdir(), 'carpool-logging-'));
process.env.LOG_FILE = path.join(directoryLog, 'errori.log');

const LogService = require('../../src/subsystems/logging/LogService');
const gestoreErrori = require('../../src/middleware/gestoreErrori');
const {
  ErroreValidazione,
  ErroreNonAutenticato,
  ErroreNonAutorizzato,
  ErroreNonTrovato,
  ErroreConflitto,
} = require('../../src/comune/errori');

function creaAppConErrore(errore) {
  const app = express();
  app.get('/errore', (_richiesta, _risposta, next) => next(errore));
  app.use(gestoreErrori);
  return app;
}

async function attendiRigheLog(numeroRighe) {
  const scadenza = Date.now() + 2000;
  while (Date.now() < scadenza) {
    if (fs.existsSync(process.env.LOG_FILE)) {
      const contenuto = fs.readFileSync(process.env.LOG_FILE, 'utf8');
      const righe = contenuto.split('\n');
      righe.pop();
      if (righe.length >= numeroRighe) return righe.map((riga) => JSON.parse(riga));
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Attese ${numeroRighe} righe nel file di log`);
}

afterAll(() => {
  fs.rmSync(directoryLog, { recursive: true, force: true });
});

describe('Logging e gestione degli errori', () => {
  test('LogService: registraErrore scrive una riga JSON con data, ora, codice, descrizione e sottosistema', async () => {
    LogService.registraErrore({
      codice: 'TEST',
      descrizione: 'Errore di prova',
      sottosistema: 'test',
    });

    const [riga] = await attendiRigheLog(1);
    expect(riga).toEqual({
      data: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      ora: expect.stringMatching(/^\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      codice: 'TEST',
      descrizione: 'Errore di prova',
      sottosistema: 'test',
    });
  });

  test('Errori: ErroreValidazione risponde 400 con { errori: [{ campo, messaggio }] }', async () => {
    const errori = [{ campo: 'email', messaggio: 'Formato non valido' }];
    const risposta = await request(creaAppConErrore(new ErroreValidazione(errori))).get('/errore');

    expect(risposta.status).toBe(400);
    expect(risposta.body).toEqual({ errori });
  });

  test('Errori: non autenticato 401, non autorizzato 403, non trovato 404', async () => {
    const casi = [
      [new ErroreNonAutenticato('Sessione assente'), 401, 'NON_AUTENTICATO'],
      [new ErroreNonAutorizzato('Ruolo non ammesso'), 403, 'NON_AUTORIZZATO'],
      [new ErroreNonTrovato('Risorsa assente'), 404, 'NON_TROVATO'],
    ];

    for (const [errore, stato, codice] of casi) {
      const risposta = await request(creaAppConErrore(errore)).get('/errore');
      expect(risposta.status).toBe(stato);
      expect(risposta.body).toEqual({
        errore: { codice, messaggio: errore.message },
      });
    }
  });

  test('Errori: ErroreConflitto risponde 409 con il suo codice', async () => {
    const errore = new ErroreConflitto('POSTI_ESAURITI', 'Non ci sono posti disponibili');
    const risposta = await request(creaAppConErrore(errore)).get('/errore');

    expect(risposta.status).toBe(409);
    expect(risposta.body).toEqual({
      errore: { codice: 'POSTI_ESAURITI', messaggio: errore.message },
    });
  });

  test('Errori: un errore imprevisto risponde 500 senza stack e finisce nel log', async () => {
    const errore = new Error('dettaglio interno');
    const risposta = await request(creaAppConErrore(errore)).get('/errore');

    expect(risposta.status).toBe(500);
    expect(risposta.body).toEqual({
      errore: {
        codice: 'ERRORE_INTERNO',
        messaggio: 'Si è verificato un errore',
      },
    });
    expect(JSON.stringify(risposta.body)).not.toContain(errore.stack);

    const righe = await attendiRigheLog(2);
    expect(righe[1]).toEqual(
      expect.objectContaining({
        codice: 'ERRORE_INTERNO',
        descrizione: 'dettaglio interno',
        sottosistema: 'backend',
      }),
    );
  });
});
