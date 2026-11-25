import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Title1 } from '@fluentui/react-components';
import { Link } from 'react-router';
import { richiesta } from '../../api/client.js';

export default function Organizzazioni() {
  const [organizzazioni, setOrganizzazioni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    richiesta('/api/organizzazioni')
      .then((risultati) => {
        if (!Array.isArray(risultati)) throw new Error('Risposta non valida dal server');
        setOrganizzazioni(risultati);
      })
      .catch((erroreRichiesta) => setErrore(erroreRichiesta.message))
      .finally(() => setCaricamento(false));
  }, []);

  return (
    <section>
      <Title1 as="h1">Organizzazioni</Title1>
      <Button appearance="primary" as={Link} to="/admin/organizzazioni/nuova">
        Nuova organizzazione
      </Button>
      {errore && <div role="alert">{errore}</div>}
      {caricamento ? <Spinner label="Caricamento organizzazioni" /> : (
        <div className="elenco-organizzazioni">
          {organizzazioni.map((organizzazione) => (
            <Card key={organizzazione.id}>
              <h2><Link to={`/admin/organizzazioni/${organizzazione.id}`}>{organizzazione.denominazione}</Link></h2>
              <p>{organizzazione.sedi.length} sedi · {organizzazione.domini.length} domini</p>
            </Card>
          ))}
          {!organizzazioni.length && !errore && <p>Nessuna organizzazione registrata.</p>}
        </div>
      )}
    </section>
  );
}
