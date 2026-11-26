const cron = require('node-cron');
const ViaggioPrenotazioneService = require('./subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const LogService = require('./subsystems/logging/LogService');

async function eseguiConclusioneViaggi() {
  try {
    await ViaggioPrenotazioneService.concludiViaggiScaduti(new Date());
  } catch (errore) {
    LogService.registraErrore({
      codice: 'ERRORE_INTERNO',
      descrizione: `Conclusione automatica dei viaggi non riuscita: ${errore.message}`,
      sottosistema: 'viaggiPrenotazioni',
    });
  }
}

function avviaPianificazione() {
  return cron.schedule('*/10 * * * *', eseguiConclusioneViaggi, { noOverlap: true });
}

module.exports = { avviaPianificazione, eseguiConclusioneViaggi };
