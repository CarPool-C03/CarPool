const fs = require('node:fs');
const path = require('node:path');
const pino = require('pino');

const percorsoLog = path.resolve(process.env.LOG_FILE || 'logs/errori.log');
fs.mkdirSync(path.dirname(percorsoLog), { recursive: true });

const destinazione = pino.destination({ dest: percorsoLog, sync: false });
destinazione.on('error', (errore) => {
  console.error('Errore nella scrittura del file di log:', errore);
});

function registraErrore({ codice, descrizione, sottosistema }) {
  const timestamp = new Date().toISOString();
  const [data, ora] = timestamp.split('T');

  destinazione.write(
    `${JSON.stringify({
      data,
      ora,
      codice,
      descrizione,
      sottosistema,
    })}\n`,
  );
}

module.exports = { registraErrore };
