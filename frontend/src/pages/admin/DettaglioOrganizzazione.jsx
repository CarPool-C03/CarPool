import { useEffect, useState } from 'react';
import { Card, Spinner, Title1, Title2 } from '@fluentui/react-components';
import { useParams } from 'react-router';
import { richiesta } from '../../api/client.js';

export default function DettaglioOrganizzazione() {
  const { id } = useParams();
  const [organizzazione, setOrganizzazione] = useState(null);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    richiesta(`/api/organizzazioni/${id}`)
      .then((risultato) => {
        if (!Array.isArray(risultato?.sedi) || !Array.isArray(risultato?.domini)) {
          throw new Error('Risposta non valida dal server');
        }
        setOrganizzazione(risultato);
      })
      .catch((erroreRichiesta) => setErrore(erroreRichiesta.message))
      .finally(() => setCaricamento(false));
  }, [id]);

  if (caricamento) return <Spinner label="Caricamento organizzazione" />;
  if (errore) {
    return (
      <section>
        <Title1 as="h1">Dettaglio organizzazione</Title1>
        <div role="alert">{errore}</div>
      </section>
    );
  }
  if (!organizzazione) return null;

  return (
    <section>
      <Title1 as="h1">Dettaglio organizzazione</Title1>
      <Title2 as="h2">{organizzazione.denominazione}</Title2>
      <Card>
        <h2>Sedi</h2>
        <ul>
          {organizzazione.sedi.map((sede) => (
            <li key={sede.id}>{sede.nome} — {sede.indirizzo}</li>
          ))}
        </ul>
        <h2>Domini autorizzati</h2>
        <ul>{organizzazione.domini.map((dominio) => <li key={dominio}>{dominio}</li>)}</ul>
      </Card>
    </section>
  );
}
