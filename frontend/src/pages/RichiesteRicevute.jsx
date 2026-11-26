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
import { Link, useParams } from 'react-router';
import { ErroreApi, richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '18px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' },
  elenco: { display: 'flex', flexDirection: 'column', gap: '10px' },
});

const ETICHETTE_STATO = {
  InAttesa: 'In attesa',
  Accettata: 'Accettata',
  Rifiutata: 'Rifiutata',
  Annullata: 'Annullata',
  Completata: 'Completata',
};

function coloreStato(stato) {
  if (stato === 'InAttesa') return 'warning';
  if (stato === 'Accettata' || stato === 'Completata') return 'success';
  return 'subtle';
}

export default function RichiesteRicevute() {
  const styles = useStyles();
  const { id } = useParams();
  const [viaggio, setViaggio] = useState(null);
  const [errore, setErrore] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/viaggi/miei').then((elenco) => {
      const trovato = [...elenco.attivi, ...elenco.conclusi]
        .find((elemento) => elemento.id === Number(id));
      if (!trovato) throw new Error('Viaggio non trovato');
      if (attivo) setViaggio(trovato);
    }).catch((erroreCaricamento) => {
      if (attivo) setErrore({
        messaggio: erroreCaricamento.message,
        api: erroreCaricamento instanceof ErroreApi,
      });
    }).finally(() => {
      if (attivo) setCaricamento(false);
    });
    return () => { attivo = false; };
  }, [id]);

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Richieste ricevute</Title1>
      {errore?.api ? (
        <MessageBar intent="error" role="alert"><MessageBarBody>{errore.messaggio}</MessageBarBody></MessageBar>
      ) : errore && <Text role="alert">{errore.messaggio}</Text>}
      {caricamento ? <Spinner label="Caricamento richieste" /> : viaggio && (
        <>
          <Card className={styles.scheda}>
            <Text weight="semibold">{viaggio.puntoPartenza} → {viaggio.sede.nome}</Text>
            <Badge>Posti residui: {viaggio.postiDisponibili}</Badge>
            <Text>{dataOraMostrata(viaggio.dataOraPartenza)} · Conducente: {viaggio.conducente.nome} {viaggio.conducente.cognome}</Text>
          </Card>
          <div className={styles.elenco} aria-label="Elenco richieste">
            {viaggio.richieste.map((elemento) => (
              <Card className={styles.scheda} key={elemento.id}>
                <Text>{elemento.passeggero.nome} {elemento.passeggero.cognome}</Text>
                <Badge appearance="filled" color={coloreStato(elemento.stato)}>
                  Stato: {ETICHETTE_STATO[elemento.stato] ?? elemento.stato}
                </Badge>
              </Card>
            ))}
            {viaggio.richieste.length === 0 && <Text>Nessuna richiesta ricevuta</Text>}
          </div>
        </>
      )}
      <Link to="/miei-viaggi">I miei viaggi</Link>
    </section>
  );
}
