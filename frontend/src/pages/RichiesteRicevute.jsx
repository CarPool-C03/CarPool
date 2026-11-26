import {
  Badge,
  Button,
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
  const [erroreRisposta, setErroreRisposta] = useState('');
  const [rispostaInCorso, setRispostaInCorso] = useState(null);

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

  async function rispondi(elemento, azione) {
    setErroreRisposta('');
    setRispostaInCorso(elemento.id);
    try {
      const esito = await richiesta(`/api/richieste/${elemento.id}/${azione}`, {
        metodo: 'POST',
      });
      setViaggio((corrente) => ({
        ...corrente,
        postiDisponibili: esito.postiDisponibili ?? corrente.postiDisponibili,
        richieste: corrente.richieste.map((richiestaCorrente) => (
          richiestaCorrente.id === elemento.id
            ? { ...richiestaCorrente, stato: esito.stato }
            : richiestaCorrente
        )),
      }));
    } catch (erroreRispostaApi) {
      setErroreRisposta(erroreRispostaApi.message);
    } finally {
      setRispostaInCorso(null);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Richieste ricevute</Title1>
      {errore?.api ? (
        <MessageBar intent="error" role="alert"><MessageBarBody>{errore.messaggio}</MessageBarBody></MessageBar>
      ) : errore && <Text role="alert">{errore.messaggio}</Text>}
      {erroreRisposta && (
        <MessageBar intent="error" role="alert">
          <MessageBarBody>{erroreRisposta}</MessageBarBody>
        </MessageBar>
      )}
      {caricamento ? <Spinner label="Caricamento richieste" /> : viaggio && (
        <>
          <Card className={styles.scheda}>
            <Text weight="semibold">{viaggio.puntoPartenza} → {viaggio.sede.nome}</Text>
            <Badge>Posti residui: {viaggio.postiDisponibili}</Badge>
            <Text>{dataOraMostrata(viaggio.dataOraPartenza)} · Conducente: {viaggio.conducente.nome} {viaggio.conducente.cognome}</Text>
          </Card>
          <Text>La conferma è possibile solo per un viaggio attivo con posti residui.</Text>
          <div className={styles.elenco} aria-label="Elenco richieste">
            {viaggio.richieste.map((elemento) => (
              <Card className={styles.scheda} key={elemento.id}>
                <Text>{elemento.passeggero.nome} {elemento.passeggero.cognome}</Text>
                <Badge appearance="filled" color={coloreStato(elemento.stato)}>
                  Stato: {ETICHETTE_STATO[elemento.stato] ?? elemento.stato}
                </Badge>
                {elemento.stato === 'InAttesa' && (
                  <div className={styles.elenco}>
                    <Button
                      onClick={() => rispondi(elemento, 'accetta')}
                      disabled={rispostaInCorso !== null || viaggio.stato !== 'Attivo'}
                    >
                      {rispostaInCorso === elemento.id ? 'Risposta…' : 'Accetta'}
                    </Button>
                    <Button
                      appearance="secondary"
                      onClick={() => rispondi(elemento, 'rifiuta')}
                      disabled={rispostaInCorso !== null || viaggio.stato !== 'Attivo'}
                    >
                      {rispostaInCorso === elemento.id ? 'Risposta…' : 'Rifiuta'}
                    </Button>
                  </div>
                )}
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
