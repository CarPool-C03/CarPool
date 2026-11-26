const AccountService = require('../account/AccountService');
const OrganizzazioneService = require('../organizzazioni/OrganizzazioneService');
const GeneraReportControl = require('./GeneraReportControl');
const { ErroreValidazione, ErroreNonAutorizzato } = require('../../comune/errori');

function validaSedeId(sedeId) {
  if (
    typeof sedeId !== 'string' ||
    !/^[1-9]\d*$/.test(sedeId) ||
    !Number.isSafeInteger(Number(sedeId))
  ) {
    throw new ErroreValidazione([
      { campo: 'sedeId', messaggio: 'Seleziona una sede valida' },
    ]);
  }
  return Number(sedeId);
}

async function generaReport(membroId, sedeId, dal, al) {
  GeneraReportControl.validaPeriodo(dal, al);
  const idSede = validaSedeId(sedeId);
  const profilo = await AccountService.profilo(membroId);
  const sedi = await OrganizzazioneService.sediOrganizzazione(profilo.organizzazione.id);
  const sede = sedi.find((elemento) => elemento.id === idSede);
  if (!sede) {
    throw new ErroreNonAutorizzato('La sede non appartiene alla tua organizzazione');
  }
  return GeneraReportControl.generaReport(sede, dal, al);
}

module.exports = { generaReport };
