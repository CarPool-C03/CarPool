const { ErroreValidazione } = require('../../comune/errori');

function erroreCampo(campo, messaggio) {
  return { campo, messaggio };
}

function partiRomaIstante(adesso) {
  const parti = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(adesso);
  const valore = (tipo) => parti.find((parte) => parte.type === tipo)?.value;
  return {
    data: `${valore('year')}-${valore('month')}-${valore('day')}`,
    orario: `${valore('hour')}:${valore('minute')}:${valore('second')}`,
  };
}

function istanteValidoEuropaRoma(valore) {
  if (typeof valore !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-][0-2]\d:[0-5]\d)?$/.exec(valore);
  if (!match) return null;
  const data = match[1];
  const ora = match[2];
  const minuto = match[3];
  const secondi = match[4]?.slice(1, 3) ?? '00';
  const millisecondi = (match[4]?.split('.')[1] ?? '').padEnd(3, '0') || '000';
  const pareggio = new Date(`${data}T${ora}:${minuto}:${secondi}.${millisecondi}Z`);
  if (Number.isNaN(pareggio.getTime())) return null;
  const candidati = [];
  for (let ore = -12; ore <= 14; ore += 1) {
    const istante = new Date(pareggio.getTime() - ore * 60 * 60 * 1000);
    const romano = partiRomaIstante(istante);
    if (romano.data === data && romano.orario === `${ora}:${minuto}:${secondi}`) {
      if (!candidati.some((candidato) => candidato.getTime() === istante.getTime())) candidati.push(istante);
    }
  }
  const conOffset = /(?:Z|[+-][0-2]\d:[0-5]\d)$/.test(valore);
  if (conOffset) {
    const fornito = new Date(valore);
    if (
      Number.isNaN(fornito.getTime()) ||
      !candidati.some((candidato) => candidato.getTime() === fornito.getTime())
    ) return null;
    return fornito;
  }
  return candidati.length === 1 ? candidati[0] : null;
}

function validaDati(dati, veicolo, sedi) {
  const errori = [];
  const istante = istanteValidoEuropaRoma(dati?.dataOraPartenza);
  if (!istante) errori.push(erroreCampo('dataOraPartenza', 'Inserisci una data e un orario validi nel fuso Europe/Rome'));
  else if (istante.getTime() <= Date.now()) errori.push(erroreCampo('dataOraPartenza', 'La data e l’orario devono essere successivi al momento corrente'));

  const punto = typeof dati?.puntoPartenza === 'string' ? dati.puntoPartenza.trim() : '';
  if (!punto || punto.length > 200) {
    errori.push(erroreCampo('puntoPartenza', 'Inserisci un punto di partenza di 1–200 caratteri'));
  }
  if (!Number.isSafeInteger(dati?.sedeId)) errori.push(erroreCampo('sedeId', 'Seleziona una sede di destinazione'));
  else if (!sedi.some((sede) => sede.id === dati.sedeId)) errori.push(erroreCampo('sedeId', 'Seleziona una sede della tua organizzazione'));

  const posti = dati?.postiOfferti;
  if (!Number.isInteger(posti) || posti < 1) errori.push(erroreCampo('postiOfferti', 'Inserisci un numero intero di posti pari o superiore a 1'));
  else if (posti > veicolo.numeroPostiPasseggeri) errori.push(erroreCampo('postiOfferti', 'I posti offerti non possono superare la capacità del veicolo'));

  let contributo = null;
  if (dati?.contributoIndicativoEuro !== null && dati?.contributoIndicativoEuro !== undefined) {
    const valore = dati.contributoIndicativoEuro;
    if (typeof valore !== 'number' || !Number.isFinite(valore) || valore < 0 ||
        Math.abs(valore * 100 - Math.round(valore * 100)) > 0.000001) {
      errori.push(erroreCampo('contributoIndicativoEuro', 'Inserisci un contributo non negativo con massimo due decimali'));
    } else contributo = Math.round(valore * 100) / 100;
  }
  if (errori.length) throw new ErroreValidazione(errori);
  return { istante, punto, sedeId: dati.sedeId, posti, contributo };
}

module.exports = validaDati;
