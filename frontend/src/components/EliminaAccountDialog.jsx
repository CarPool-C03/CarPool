import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  MessageBar,
  MessageBarBody,
  Text,
} from '@fluentui/react-components';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErroreValidazione, richiesta } from '../api/client.js';
import CampoModulo from './CampoModulo.jsx';

export default function EliminaAccountDialog() {
  const navigate = useNavigate();
  const [aperto, setAperto] = useState(false);
  const [password, setPassword] = useState('');
  const [errorePassword, setErrorePassword] = useState('');
  const [erroreInvio, setErroreInvio] = useState('');
  const [eliminazione, setEliminazione] = useState(false);

  function chiudi() {
    if (eliminazione) return;
    setAperto(false);
    setPassword('');
    setErrorePassword('');
    setErroreInvio('');
  }

  async function conferma(evento) {
    evento.preventDefault();
    setErrorePassword('');
    setErroreInvio('');
    setEliminazione(true);
    try {
      await richiesta('/api/account', { metodo: 'DELETE', corpo: { password } });
      navigate('/');
    } catch (errore) {
      if (errore instanceof ErroreValidazione) {
        const erroreCampo = errore.errori.find(({ campo }) => campo === 'password');
        if (erroreCampo) setErrorePassword(erroreCampo.messaggio);
        else setErroreInvio(errore.message);
      } else {
        setErroreInvio(errore.message);
      }
    } finally {
      setEliminazione(false);
    }
  }

  return (
    <Dialog
      open={aperto}
      onOpenChange={(_, dati) => {
        if (!dati.open) chiudi();
        else setAperto(true);
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="secondary">Elimina il mio account</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Conferma eliminazione account</DialogTitle>
          <DialogContent>
            <Text>
              L’account e il profilo saranno anonimizzati. Veicolo, messaggi inviati e valutazioni
              scritte o ricevute saranno eliminati; i viaggi attivi saranno cancellati e le richieste
              non concluse annullate. Viaggi conclusi e richieste completate resteranno anonimi.
              Tutte le sessioni saranno chiuse.
            </Text>
            <form id="elimina-account" onSubmit={conferma}>
              <CampoModulo
                etichetta="Password"
                nome="password-eliminazione"
                type="password"
                required
                value={password}
                errore={errorePassword}
                onChange={(evento) => setPassword(evento.target.value)}
              />
              {erroreInvio && (
                <MessageBar intent="error" role="alert">
                  <MessageBarBody>{erroreInvio}</MessageBarBody>
                </MessageBar>
              )}
            </form>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={chiudi} disabled={eliminazione}>
              Annulla
            </Button>
            <Button
              appearance="primary"
              type="submit"
              form="elimina-account"
              disabled={eliminazione || !password}
            >
              Conferma eliminazione
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
