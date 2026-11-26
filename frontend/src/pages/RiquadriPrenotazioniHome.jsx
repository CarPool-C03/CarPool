import { Badge, Button, Card, Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import AvvisoErrore from '../components/AvvisoErrore.jsx';
import { richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  riquadri: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: 'var(--spazio-3)' },
  stato: { color: tokens.colorNeutralForeground2 },
  riquadro: { display: 'flex', flexDirection: 'column', gap: 'var(--spazio-2)', padding: 'var(--spazio-4)' },
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

  if (errore) return <AvvisoErrore>{errore}</AvvisoErrore>;

  const prossimoViaggio = richieste && prossimaRichiesta(richieste, 'Accettata');
  const prossimaInAttesa = richieste && prossimaRichiesta(richieste, 'InAttesa');

  return (
    <section className={styles.riquadri} aria-label="Riepilogo prenotazioni" aria-live="polite">
      <Card className={styles.riquadro}>
        <Title2 as="h2">Il tuo prossimo viaggio</Title2>
        {richieste === null ? (
          <Text className={styles.stato}>Caricamento…</Text>
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
        ) : <Text className={styles.stato}>Nessun viaggio in programma</Text>}
      </Card>
      <Card className={styles.riquadro}>
        <Title2 as="h2">Le tue richieste</Title2>
        {richieste === null ? (
          <Text className={styles.stato}>Caricamento…</Text>
        ) : prossimaInAttesa ? (
          <>
            <Badge appearance="filled" color="warning">In attesa</Badge>
            <Text>{dataOraMostrata(prossimaInAttesa.viaggio.dataOraPartenza)}</Text>
            <Text>
              {prossimaInAttesa.viaggio.puntoPartenza} → {prossimaInAttesa.viaggio.sede?.nome}
            </Text>
            <Button onClick={() => navigate('/prenotazioni')}>Le mie prenotazioni</Button>
          </>
        ) : <Text className={styles.stato}>Non hai richieste in attesa</Text>}
      </Card>
    </section>
  );
}
