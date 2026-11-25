import { Badge, Button, Card, Text, Title2, makeStyles } from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  riquadri: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' },
  riquadro: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' },
});

function prossimaRichiesta(richieste, stato) {
  const adesso = Date.now();
  return richieste
    .filter((richiestaUtente) => (
      richiestaUtente.stato === stato &&
      new Date(richiestaUtente.viaggio.dataOraPartenza).getTime() > adesso
    ))
    .sort((a, b) => (
      new Date(a.viaggio.dataOraPartenza) - new Date(b.viaggio.dataOraPartenza)
    ))[0];
}

export default function RiquadriPrenotazioniHome() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [richieste, setRichieste] = useState(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    let attivo = true;
    richiesta('/api/richieste/mie')
      .then((risposta) => {
        if (!Array.isArray(risposta?.richieste)) {
          throw new Error('Risposta non valida durante il caricamento delle richieste');
        }
        if (attivo) setRichieste(risposta.richieste);
      })
      .catch((erroreCaricamento) => {
        if (attivo) setErrore(erroreCaricamento.message);
      });
    return () => {
      attivo = false;
    };
  }, []);

  if (errore) return <Text role="alert">{errore}</Text>;

  const prossimoViaggio = richieste && prossimaRichiesta(richieste, 'Accettata');
  const prossimaInAttesa = richieste && prossimaRichiesta(richieste, 'InAttesa');

  return (
    <section className={styles.riquadri}>
      <Card className={styles.riquadro}>
        <Title2 as="h2">Il tuo prossimo viaggio</Title2>
        {richieste === null ? (
          <Text>Caricamento…</Text>
        ) : prossimoViaggio ? (
          <>
            <Badge appearance="filled" color="success">Accettata</Badge>
            <Text>{dataOraMostrata(prossimoViaggio.viaggio.dataOraPartenza)}</Text>
            <Text>
              {prossimoViaggio.viaggio.puntoPartenza} → {prossimoViaggio.viaggio.sede?.nome}
            </Text>
            <Text>
              Con {prossimoViaggio.viaggio.conducente.nome} {prossimoViaggio.viaggio.conducente.cognome}
            </Text>
            <Button onClick={() => navigate(`/viaggi/${prossimoViaggio.viaggio.id}`)}>
              Dettaglio viaggio
            </Button>
          </>
        ) : <Text>Nessun viaggio in programma</Text>}
      </Card>
      <Card className={styles.riquadro}>
        <Title2 as="h2">Le tue richieste</Title2>
        {richieste === null ? (
          <Text>Caricamento…</Text>
        ) : prossimaInAttesa ? (
          <>
            <Badge appearance="filled" color="warning">In attesa</Badge>
            <Text>{dataOraMostrata(prossimaInAttesa.viaggio.dataOraPartenza)}</Text>
            <Text>
              {prossimaInAttesa.viaggio.puntoPartenza} → {prossimaInAttesa.viaggio.sede?.nome}
            </Text>
            <Button onClick={() => navigate('/prenotazioni')}>Le mie prenotazioni</Button>
          </>
        ) : <Text>Non hai richieste in attesa</Text>}
      </Card>
    </section>
  );
}
