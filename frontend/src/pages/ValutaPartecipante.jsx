import {
  Button,
  Card,
  Field,
  MessageBar,
  MessageBarBody,
  Select,
  Text,
  Textarea,
  Title1,
  Title2,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErroreValidazione, richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '20px' },
  contenuto: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  azioni: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' },
});

function trovaViaggio(risposta, id) {
  if (!Array.isArray(risposta?.daFare)) {
    throw new Error('Risposta non valida durante il caricamento delle valutazioni');
  }
  return risposta.daFare.find((elemento) => elemento.viaggio?.id === id) ?? null;
}

export default function ValutaPartecipante() {
  const styles = useStyles();
  const { viaggioId: parametroId } = useParams();
  const viaggioId = Number(parametroId);
  const [elemento, setElemento] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [partecipanteId, setPartecipanteId] = useState('');
  const [punteggio, setPunteggio] = useState('');
  const [commento, setCommento] = useState('');
  const [erroriCampo, setErroriCampo] = useState({});
  const [errore, setErrore] = useState('');
  const [inviata, setInviata] = useState(false);
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/valutazioni/da-fare')
      .then((risposta) => {
        const risultato = trovaViaggio(risposta, viaggioId);
        if (attivo) setElemento(risultato);
      })
      .catch((erroreCaricamento) => {
        if (attivo) setErrore(erroreCaricamento.message);
      })
      .finally(() => {
        if (attivo) setCaricamento(false);
      });
    return () => {
      attivo = false;
    };
  }, [viaggioId]);

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setErroriCampo({});
    setInvio(true);
    try {
      const risultato = await richiesta(`/api/viaggi/${viaggioId}/valutazioni`, {
        metodo: 'POST',
        corpo: {
          valutatoId: Number(partecipanteId),
          punteggio: Number(punteggio),
          commento: commento || null,
        },
      });
      if (!Number.isInteger(risultato?.id) || typeof risultato.mediaValutato !== 'number') {
        throw new Error('Risposta non valida durante il salvataggio della valutazione');
      }
      setInviata(true);
    } catch (erroreInvio) {
      if (erroreInvio instanceof ErroreValidazione) {
        setErroriCampo(Object.fromEntries(
          erroreInvio.errori.map(({ campo, messaggio }) => [campo, messaggio]),
        ));
      } else {
        setErrore(erroreInvio.message);
      }
    } finally {
      setInvio(false);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Valuta un partecipante</Title1>
      {errore && <MessageBar intent="error"><MessageBarBody>{errore}</MessageBarBody></MessageBar>}
      {caricamento ? (
        <Text>Caricamento…</Text>
      ) : !elemento ? (
        <Text>Non ci sono partecipanti da valutare per questo viaggio</Text>
      ) : (
        <div className={styles.contenuto}>
          <Card className={styles.scheda}>
            <Title2 as="h2">Viaggio concluso</Title2>
            <Text>{dataOraMostrata(elemento.viaggio.dataOraPartenza)}</Text>
            {elemento.viaggio.sede?.nome && <Text>Destinazione: {elemento.viaggio.sede.nome}</Text>}
            <Text>La valutazione è consentita una sola volta per partecipante.</Text>
          </Card>
          <Card className={styles.scheda}>
            <Title2 as="h2">La tua valutazione</Title2>
            {inviata ? (
              <>
                <Text role="status">Valutazione registrata</Text>
                <Link to="/valutazioni">Torna ai viaggi da valutare</Link>
              </>
            ) : (
              <form className={styles.scheda} onSubmit={invia}>
                <Field
                  label="Partecipante da valutare"
                  validationMessage={erroriCampo.valutatoId}
                  validationState={erroriCampo.valutatoId ? 'error' : 'none'}
                >
                  <Select
                    required
                    value={partecipanteId}
                    disabled={invio}
                    onChange={(evento) => setPartecipanteId(evento.target.value)}
                  >
                    <option value="">Seleziona un partecipante</option>
                    {elemento.persone.map((persona) => (
                      <option key={persona.membroId} value={persona.membroId}>
                        {persona.nome} {persona.cognome} · {persona.ruolo}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Punteggio (1–5)"
                  validationMessage={erroriCampo.punteggio}
                  validationState={erroriCampo.punteggio ? 'error' : 'none'}
                >
                  <Select
                    required
                    value={punteggio}
                    disabled={invio}
                    onChange={(evento) => setPunteggio(evento.target.value)}
                  >
                    <option value="">Seleziona un punteggio</option>
                    {[1, 2, 3, 4, 5].map((valore) => (
                      <option key={valore} value={valore}>{valore}</option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Commento (facoltativo)"
                  validationMessage={erroriCampo.commento}
                  validationState={erroriCampo.commento ? 'error' : 'none'}
                >
                  <Textarea
                    value={commento}
                    maxLength={500}
                    placeholder="Com'è andato il viaggio?"
                    disabled={invio}
                    onChange={(evento) => setCommento(evento.target.value)}
                  />
                </Field>
                <div className={styles.azioni}>
                  <Button appearance="primary" type="submit" disabled={invio}>
                    {invio ? 'Invio…' : 'Invia valutazione'}
                  </Button>
                  <Link to="/valutazioni">Annulla</Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}
