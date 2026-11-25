const PersistenzaService = require('../persistenza/PersistenzaService');
const {
  ErroreValidazione,
  ErroreNonTrovato,
} = require('../../comune/errori');

const REGEX_DOMINIO = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

function erroreCampo(campo, messaggio) {
  return new ErroreValidazione([{ campo, messaggio }]);
}

function validaDati(dati) {
  const errori = [];
  const denominazione = typeof dati?.denominazione === 'string'
    ? dati.denominazione.trim()
    : '';
  if (!denominazione || denominazione.length > 200) {
    errori.push({ campo: 'denominazione', messaggio: 'Inserisci una denominazione di 1–200 caratteri' });
  }

  const sedi = Array.isArray(dati?.sedi) ? dati.sedi : [];
  if (!sedi.length) errori.push({ campo: 'sedi', messaggio: 'Inserisci almeno una sede' });
  const sediValide = sedi.map((sede, indice) => {
    const nome = typeof sede?.nome === 'string' ? sede.nome.trim() : '';
    const indirizzo = typeof sede?.indirizzo === 'string' ? sede.indirizzo.trim() : '';
    if (!nome || nome.length > 200) {
      errori.push({ campo: `sedi[${indice}].nome`, messaggio: 'Inserisci un nome di 1–200 caratteri' });
    }
    if (!indirizzo || indirizzo.length > 300) {
      errori.push({ campo: `sedi[${indice}].indirizzo`, messaggio: 'Inserisci un indirizzo di 1–300 caratteri' });
    }
    return { nome, indirizzo };
  });

  const dominiInput = Array.isArray(dati?.domini) ? dati.domini : [];
  if (!dominiInput.length) errori.push({ campo: 'domini', messaggio: 'Inserisci almeno un dominio' });
  const domini = dominiInput.map((dominio, indice) => {
    const normalizzato = typeof dominio === 'string' ? dominio.trim().toLowerCase() : '';
    if (
      normalizzato.length > 254 ||
      !REGEX_DOMINIO.test(normalizzato) ||
      dominiInput.slice(0, indice).some((precedente) =>
        typeof precedente === 'string' && precedente.trim().toLowerCase() === normalizzato)
    ) {
      errori.push({ campo: `domini[${indice}]`, messaggio: 'Inserisci un dominio valido e non ripetuto' });
    }
    return normalizzato;
  });

  if (errori.length) throw new ErroreValidazione(errori);
  return { denominazione, sedi: sediValide, domini };
}

async function riconosciDominio(email) {
  if (typeof email !== 'string') return null;
  const normalizzata = email.trim().toLowerCase();
  const separatore = normalizzata.lastIndexOf('@');
  if (separatore < 1 || separatore === normalizzata.length - 1) return null;
  const dominio = normalizzata.slice(separatore + 1);
  if (!REGEX_DOMINIO.test(dominio)) return null;
  return PersistenzaService.cercaOrganizzazioneAttivaPerDominio(dominio);
}

async function registraOrganizzazione(dati) {
  const validati = validaDati(dati);
  try {
    return await PersistenzaService.registraOrganizzazione(validati);
  } catch (errore) {
    if (errore.code === '23505' && errore.constraint === 'DominioEmail_dominio_key') {
      const indice = validati.domini.findIndex((dominio) => errore.detail?.includes(dominio));
      throw erroreCampo(
        `domini[${Math.max(indice, 0)}]`,
        'dominio già usato da un’altra organizzazione',
      );
    }
    throw errore;
  }
}

async function elencoOrganizzazioni() {
  return PersistenzaService.elencoOrganizzazioni();
}

async function dettaglioOrganizzazione(id) {
  const organizzazione = await PersistenzaService.dettaglioOrganizzazione(id);
  if (!organizzazione) throw new ErroreNonTrovato('Organizzazione non trovata');
  return organizzazione;
}

async function sediOrganizzazione(organizzazioneId) {
  return PersistenzaService.sediOrganizzazione(organizzazioneId);
}

module.exports = {
  riconosciDominio,
  registraOrganizzazione,
  elencoOrganizzazioni,
  dettaglioOrganizzazione,
  sediOrganizzazione,
};
