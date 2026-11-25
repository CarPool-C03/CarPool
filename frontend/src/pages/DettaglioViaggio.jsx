import {
  Badge,
  Card,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  Title1,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { richiesta } from '../api/client.js';
import { contributoMostrato, dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '24px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px', maxWidth: '720px' },
});

export default function DettaglioViaggio() {
  const styles = useStyles();
  const { id } = useParams();
  const [viaggio, setViaggio] = useState(null);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    let attivo = true;
    richiesta(`/api/viaggi/${id}`)
      .then((dati) => {
        if (!attivo) return;
        if (
          !dati ||
          !dati.sede ||
          !dati.conducente ||
          typeof dati.puntoPartenza !== 'string'
        ) {
          setViaggio(null);
          setErrore('');
          return;
        }
        setViaggio(dati);
      })
      .catch((erroreDettaglio) => { if (attivo) setErrore(erroreDettaglio.message); })
      .finally(() => { if (attivo) setCaricamento(false); });
    return () => { attivo = false; };
  }, [id]);

  if (caricamento) return <Spinner label="Caricamento viaggio" />;
  if (errore) return <MessageBar intent="error"><MessageBarBody>{errore}</MessageBarBody></MessageBar>;
  if (!viaggio) return <Text>Viaggio non disponibile.</Text>;

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Dettaglio viaggio</Title1>
      <Card className={styles.scheda}>
        <Badge appearance="filled" color={viaggio.stato === 'Attivo' ? 'success' : 'informative'}>{viaggio.stato}</Badge>
        <Text weight="semibold">{dataOraMostrata(viaggio.dataOraPartenza)}</Text>
        <Text>{viaggio.puntoPartenza} → {viaggio.sede.nome}</Text>
        <Text>Conducente: {viaggio.conducente.nome} {viaggio.conducente.cognome}</Text>
        <Text>Posti disponibili: {viaggio.postiDisponibili}</Text>
        <Text>{contributoMostrato(viaggio.contributoIndicativoEuro)}</Text>
      </Card>
    </section>
  );
}
