// Client unico delle API REST: cookie di sessione e traduzione degli errori.
export class ErroreApi extends Error {
  constructor({ stato, codice, messaggio }) {
    super(messaggio);
    this.name = 'ErroreApi';
    this.stato = stato;
    this.codice = codice;
    this.messaggio = messaggio;
  }
}

export class ErroreNonAutenticato extends ErroreApi {
  constructor(messaggio = 'Sessione non valida') {
    super({ stato: 401, codice: 'NON_AUTENTICATO', messaggio });
    this.name = 'ErroreNonAutenticato';
  }
}

export class ErroreValidazione extends Error {
  constructor(errori) {
    super('Dati non validi');
    this.name = 'ErroreValidazione';
    this.errori = errori;
  }
}

async function leggiCorpo(risposta) {
  if (risposta.status === 204) return null;
  try {
    return await risposta.json();
  } catch {
    return null;
  }
}

export async function richiesta(percorso, { metodo = 'GET', corpo } = {}) {
  const opzioni = {
    method: metodo,
    credentials: 'include',
    headers: {},
  };

  if (corpo !== undefined) {
    opzioni.headers['Content-Type'] = 'application/json';
    opzioni.body = JSON.stringify(corpo);
  }

  const risposta = await fetch(percorso, opzioni);
  const dati = await leggiCorpo(risposta);

  if (risposta.status === 401 && dati?.errore?.codice === 'NON_AUTENTICATO') {
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    throw new ErroreNonAutenticato(dati?.errore?.messaggio);
  }

  if (risposta.status === 400) {
    throw new ErroreValidazione(dati?.errori ?? []);
  }

  if (!risposta.ok) {
    throw new ErroreApi({
      stato: risposta.status,
      codice: dati?.errore?.codice ?? 'ERRORE',
      messaggio: dati?.errore?.messaggio ?? 'Si è verificato un errore',
    });
  }

  return dati;
}
