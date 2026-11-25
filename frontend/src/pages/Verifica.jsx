import { Card, Text, Title1 } from '@fluentui/react-components';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ErroreValidazione, richiesta } from '../api/client.js';

export default function Verifica() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const richiestaCorrente = useRef(null);
  const [risultato, setRisultato] = useState(null);
  const esito = !token
    ? 'errore'
    : risultato?.token === token
      ? risultato.esito
      : 'caricamento';
  const messaggio = !token
    ? 'Il link di verifica non è valido.'
    : risultato?.token === token
      ? risultato.messaggio
      : '';

  useEffect(() => {
    let attivo = true;
    if (!token) return;

    if (!richiestaCorrente.current || richiestaCorrente.current.token !== token) {
      richiestaCorrente.current = {
        token,
        risultato: richiesta('/api/account/verifica', {
          metodo: 'POST',
          corpo: { token },
        }).then(
          () => ({ valido: true }),
          (errore) => ({ valido: false, errore }),
        ),
      };
    }
    richiestaCorrente.current.risultato.then(({ valido, errore }) => {
      if (!attivo) return;
      if (valido) {
        setRisultato({ token, esito: 'successo', messaggio: '' });
      } else {
        setRisultato({
          token,
          esito: 'errore',
          messaggio: errore instanceof ErroreValidazione
            ? 'Il link di verifica non è valido, è scaduto o è già stato utilizzato.'
            : errore.message,
        });
      }
    });

    return () => {
      attivo = false;
    };
  }, [token]);

  return (
    <Card>
      <Title1 as="h1">Esito della verifica</Title1>
      {esito === 'caricamento' && <Text>Verifica dell’indirizzo e-mail in corso…</Text>}
      {esito === 'successo' && (
        <>
          <Text>Account attivato</Text>
          <Link to="/login">Vai ad Accedi</Link>
        </>
      )}
      {esito === 'errore' && <Text role="alert">{messaggio}</Text>}
    </Card>
  );
}
