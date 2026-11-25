// Guardia delle rotte: richiede un utente e, se indicati, i ruoli ammessi.
import { Navigate } from 'react-router';
import { Spinner } from '@fluentui/react-components';
import { useUtente } from '../auth/UtenteContext.jsx';

function ruoloAmmesso(ruolo, ruoli) {
  if (!ruoli || ruoli.length === 0) return true;
  if (ruoli.includes(ruolo)) return true;
  return ruolo === 'MobilityManager' && ruoli.includes('Membro');
}

export default function RottaProtetta({ ruoli, children }) {
  const { utente, caricamento } = useUtente();

  if (caricamento) {
    return <Spinner label="Caricamento…" />;
  }

  if (!utente) {
    return <Navigate to="/login" replace />;
  }

  if (!ruoloAmmesso(utente.ruolo, ruoli)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
