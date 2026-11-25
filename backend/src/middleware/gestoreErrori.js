const {
  ErroreValidazione,
  ErroreNonAutenticato,
  ErroreNonAutorizzato,
  ErroreNonTrovato,
  ErroreConflitto,
} = require('../comune/errori');
const LogService = require('../subsystems/logging/LogService');

function gestoreErrori(errore, _richiesta, risposta, next) {
  if (risposta.headersSent) {
    return next(errore);
  }

  if (errore instanceof ErroreValidazione) {
    return risposta.status(400).json({ errori: errore.errori });
  }

  const erroriNoti = [
    [ErroreNonAutenticato, 401, 'NON_AUTENTICATO'],
    [ErroreNonAutorizzato, 403, 'NON_AUTORIZZATO'],
    [ErroreNonTrovato, 404, 'NON_TROVATO'],
  ];
  const erroreNoto = erroriNoti.find(([Classe]) => errore instanceof Classe);
  if (erroreNoto) {
    const [, stato, codice] = erroreNoto;
    return risposta.status(stato).json({
      errore: { codice, messaggio: errore.message },
    });
  }

  if (errore instanceof ErroreConflitto) {
    return risposta.status(409).json({
      errore: { codice: errore.codice, messaggio: errore.message },
    });
  }

  LogService.registraErrore({
    codice: 'ERRORE_INTERNO',
    descrizione: errore.message || String(errore),
    sottosistema: 'backend',
  });
  return risposta.status(500).json({
    errore: {
      codice: 'ERRORE_INTERNO',
      messaggio: 'Si è verificato un errore',
    },
  });
}

module.exports = gestoreErrori;
