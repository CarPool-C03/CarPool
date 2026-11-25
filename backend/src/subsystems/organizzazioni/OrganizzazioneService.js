const PersistenzaService = require('../persistenza/PersistenzaService');

async function riconosciDominio(email) {
  if (typeof email !== 'string') return null;
  const separatore = email.lastIndexOf('@');
  if (separatore < 1 || separatore === email.length - 1) return null;

  const dominio = email.slice(separatore + 1).trim().toLowerCase();
  if (!dominio) return null;
  return PersistenzaService.trovaOrganizzazioneAttivaPerDominio(dominio);
}

module.exports = { riconosciDominio };
