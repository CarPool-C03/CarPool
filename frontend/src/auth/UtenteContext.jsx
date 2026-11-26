// Contesto dell'utente autenticato: null significa visitatore.
// Il file esporta provider e hook insieme: la regola di Fast Refresh non si applica.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ErroreApi, richiesta, urlApi } from '../api/client.js';

const UtenteContext = createContext(null);

async function caricaUtente() {
  const risposta = await fetch(urlApi('/api/auth/me'), {
    credentials: 'include',
  });
  const dati = await risposta.json();
  if (
    risposta.status === 401 &&
    dati?.errore?.codice === 'NON_AUTENTICATO'
  ) {
    return null;
  }
  if (!risposta.ok) {
    throw new ErroreApi({
      stato: risposta.status,
      codice: dati?.errore?.codice ?? 'ERRORE',
      messaggio: dati?.errore?.messaggio ?? 'Impossibile caricare la sessione',
    });
  }
  return dati;
}

export function UtenteProvider({ utenteIniziale, children }) {
  const [utente, setUtente] = useState(utenteIniziale ?? null);
  const [caricamento, setCaricamento] = useState(utenteIniziale === undefined);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    if (utenteIniziale !== undefined) return undefined;

    let attivo = true;
    caricaUtente().then((dati) => {
      if (!attivo) return;
      setUtente(dati);
      setCaricamento(false);
    }).catch((erroreCaricamento) => {
      if (!attivo) return;
      setErrore(erroreCaricamento);
      setCaricamento(false);
    });

    return () => {
      attivo = false;
    };
  }, [utenteIniziale]);

  const aggiorna = useCallback(async () => {
    setCaricamento(true);
    try {
      const dati = await caricaUtente();
      setUtente(dati);
      setErrore(null);
      return dati;
    } catch (erroreAggiornamento) {
      setErrore(erroreAggiornamento);
      throw erroreAggiornamento;
    } finally {
      setCaricamento(false);
    }
  }, []);

  const accedi = useCallback(async (email, password) => {
    const dati = await richiesta('/api/auth/login', {
      metodo: 'POST',
      corpo: { email, password },
    });
    setUtente(dati);
    setErrore(null);
    return dati;
  }, []);

  const esci = useCallback(async () => {
    await richiesta('/api/auth/logout', { metodo: 'POST' });
    setUtente(null);
    setErrore(null);
  }, []);

  if (errore) {
    return <div role="alert">Errore nel caricamento della sessione: {errore.message}</div>;
  }

  return (
    <UtenteContext.Provider value={{ utente, caricamento, aggiorna, accedi, esci }}>
      {children}
    </UtenteContext.Provider>
  );
}

export function useUtente() {
  const contesto = useContext(UtenteContext);
  if (contesto === null) {
    throw new Error('useUtente deve essere usato dentro UtenteProvider');
  }
  return contesto;
}
