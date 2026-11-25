class ErroreValidazione extends Error {
  constructor(errori) {
    super('Dati non validi');
    this.name = 'ErroreValidazione';
    this.errori = errori;
  }
}

class ErroreNonAutenticato extends Error {
  constructor(messaggio) {
    super(messaggio);
    this.name = 'ErroreNonAutenticato';
  }
}

class ErroreNonAutorizzato extends Error {
  constructor(messaggio) {
    super(messaggio);
    this.name = 'ErroreNonAutorizzato';
  }
}

class ErroreNonTrovato extends Error {
  constructor(messaggio) {
    super(messaggio);
    this.name = 'ErroreNonTrovato';
  }
}

class ErroreConflitto extends Error {
  constructor(codice, messaggio) {
    super(messaggio);
    this.name = 'ErroreConflitto';
    this.codice = codice;
  }
}

module.exports = {
  ErroreValidazione,
  ErroreNonAutenticato,
  ErroreNonAutorizzato,
  ErroreNonTrovato,
  ErroreConflitto,
};
