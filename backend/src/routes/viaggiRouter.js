const express = require('express');
const ViaggioPrenotazioneService = require('../subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const RicercaPerSede = require('../subsystems/viaggiPrenotazioni/ricerca/RicercaPerSede');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');

const router = express.Router();
const formatoDataOraEuropeRome = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Rome',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'longOffset',
});

function serializzaDataOraEuropeRome(valore) {
  const data = new Date(valore);
  const valori = Object.fromEntries(
    formatoDataOraEuropeRome
      .formatToParts(data)
      .map(({ type, value }) => [type, value]),
  );
  const millisecondi = data.getUTCMilliseconds();
  const frazione = millisecondi === 0 ? '' : `.${String(millisecondi).padStart(3, '0')}`;
  const offset = valori.timeZoneName.replace(/^GMT/, '');

  return `${valori.year}-${valori.month}-${valori.day}T${valori.hour}:${valori.minute}:${valori.second}${frazione}${offset}`;
}

router.get(
  '/viaggi/ricerca',
  richiediAutenticazione,
  richiediRuolo('Membro'),
  async (richiesta, risposta) => {
    const criterio = new RicercaPerSede({
      zona: richiesta.query.zona,
      sedeId: richiesta.query.sedeId,
      data: richiesta.query.data,
      orarioMinimo: richiesta.query.orarioMinimo,
    });
    const viaggi = await ViaggioPrenotazioneService.cercaViaggi(
      criterio,
      richiesta.utente.membro.id,
      richiesta.utente.organizzazione.id,
    );
    const viaggiSerializzati = viaggi.map((viaggio) => ({
      ...viaggio,
      dataOraPartenza: serializzaDataOraEuropeRome(viaggio.dataOraPartenza),
    }));
    risposta.status(200).json({ viaggi: viaggiSerializzati });
  },
);

module.exports = router;
