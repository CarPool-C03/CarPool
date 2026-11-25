// Contesto dell'utente autenticato: null significa visitatore.
// Il file esporta provider e hook insieme: la regola di Fast Refresh non si applica.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const UtenteContext = createContext(null);

async function caricaUtente() {
  try {
    const risposta = await fetch('/api/auth/me', { credentials: 'include' });
    if (risposta.status === 401 || risposta.status === 404) return null;
    if (!risposta.ok) return null;
    return await risposta.json();
  } catch {
    return null;
  }
}

export function UtenteProvider({ utenteIniziale, children }) {
  const [utente, setUtente] = useState(utenteIniziale ?? null);
  const [caricamento, setCaricamento] = useState(utenteIniziale === undefined);

  useEffect(() => {
    if (utenteIniziale !== undefined) return undefined;

    let attivo = true;
    caricaUtente().then((dati) => {
      if (!attivo) return;
      setUtente(dati);
      setCaricamento(false);
    });

    return () => {
      attivo = false;
    };
  }, [utenteIniziale]);

  const aggiorna = useCallback(async () => {
    setCaricamento(true);
    const dati = await caricaUtente();
    setUtente(dati);
    setCaricamento(false);
    return dati;
  }, []);

  return (
    <UtenteContext.Provider value={{ utente, caricamento, aggiorna }}>
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
