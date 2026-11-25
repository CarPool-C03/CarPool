import {
  Badge,
  Button,
  Card,
  Text,
  Title1,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '20px' },
  elenco: { display: 'flex', flexDirection: 'column', gap: '14px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' },
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

function annullabile(richiestaUtente) {
  return ['InAttesa', 'Accettata'].includes(richiestaUtente.stato) &&
    richiestaUtente.viaggio.stato !== 'Concluso';
}

export default function LeMiePrenotazioni() {
  const styles = useStyles();
  const [richieste, setRichieste] = useState(null);
  const [errore, setErrore] = useState('');
  const [annullamentoId, setAnnullamentoId] = useState(null);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/richieste/mie')
      .then((risposta) => {
        if (!Array.isArray(risposta?.richieste)) {
          throw new Error('Risposta non valida durante il caricamento delle prenotazioni');
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

  async function annulla(richiestaUtente) {
    setErrore('');
    setAnnullamentoId(richiestaUtente.id);
    try {
      const aggiornata = await richiesta(`/api/richieste/${richiestaUtente.id}/annulla`, {
        metodo: 'POST',
      });
      if (aggiornata?.id !== richiestaUtente.id || aggiornata.stato !== 'Annullata') {
        throw new Error('Risposta non valida durante l’annullamento della prenotazione');
      }
      setRichieste((correnti) => correnti.map((elemento) => (
        elemento.id === aggiornata.id ? { ...elemento, stato: aggiornata.stato } : elemento
      )));
    } catch (erroreAnnullamento) {
      setErrore(erroreAnnullamento.message);
    } finally {
      setAnnullamentoId(null);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Le mie prenotazioni</Title1>
      {errore && <Text role="alert">{errore}</Text>}
      {richieste === null ? (
        <Text>Caricamento…</Text>
      ) : richieste.length === 0 ? (
        <Text>Non hai richieste di prenotazione</Text>
      ) : (
        <div className={styles.elenco}>
          {richieste.map((elemento) => (
            <Card className={styles.scheda} key={elemento.id}>
              <Badge appearance="filled" color={coloreStato(elemento.stato)}>
                {ETICHETTE_STATO[elemento.stato] ?? elemento.stato}
              </Badge>
              <Text>{elemento.viaggio.puntoPartenza} → {elemento.viaggio.sede?.nome}</Text>
              <Text>{dataOraMostrata(elemento.viaggio.dataOraPartenza)}</Text>
              <Text>
                Con {elemento.viaggio.conducente.nome} {elemento.viaggio.conducente.cognome}
              </Text>
              {annullabile(elemento) && (
                <Button
                  disabled={annullamentoId !== null}
                  onClick={() => annulla(elemento)}
                >
                  {annullamentoId === elemento.id ? 'Annullamento…' : 'Annulla'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
