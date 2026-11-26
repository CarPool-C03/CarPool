import {
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Text,
  Title1,
  Title2,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { ErroreValidazione, richiesta } from '../api/client.js';
import ReportRisultati from './ReportRisultati.jsx';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '24px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  modulo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  azioni: { gridColumn: '1 / -1' },
});

function erroriPerCampo(errori) {
  return Object.fromEntries(errori.map(({ campo, messaggio }) => [campo, messaggio]));
}

function rispostaValida(risposta) {
  return risposta
    && risposta.sede
    && Number.isInteger(risposta.totali?.viaggiCondivisi)
    && Number.isInteger(risposta.totali?.postiOfferti)
    && Number.isInteger(risposta.totali?.passeggeriTrasportati)
    && Array.isArray(risposta.mesi)
    && risposta.mesi.every((mese) => (
      typeof mese.mese === 'string'
      && Number.isInteger(mese.viaggiCondivisi)
      && Number.isInteger(mese.postiOfferti)
      && Number.isInteger(mese.passeggeriTrasportati)
    ))
    && typeof risposta.avviso !== 'undefined';
}

export default function Report() {
  const styles = useStyles();
  const [sedi, setSedi] = useState([]);
  const [dati, setDati] = useState({ sedeId: '', dal: '', al: '' });
  const [erroriCampo, setErroriCampo] = useState({});
  const [errore, setErrore] = useState('');
  const [report, setReport] = useState(null);
  const [caricamentoSedi, setCaricamentoSedi] = useState(true);
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/sedi')
      .then((risultato) => {
        if (!Array.isArray(risultato)) {
          throw new Error('Risposta non valida durante il caricamento delle sedi');
        }
        if (attivo) setSedi(risultato);
      })
      .catch((erroreSedi) => {
        if (attivo) setErrore(erroreSedi.message);
      })
      .finally(() => {
        if (attivo) setCaricamentoSedi(false);
      });
    return () => { attivo = false; };
  }, []);

  function cambia(campo, valore) {
    setDati((correnti) => ({ ...correnti, [campo]: valore }));
  }

  async function generaReport(evento) {
    evento.preventDefault();
    setErroriCampo({});
    setErrore('');
    setReport(null);
    setInvio(true);
    try {
      const parametri = new URLSearchParams(dati);
      const risultato = await richiesta(`/api/report?${parametri}`);
      if (!rispostaValida(risultato)) {
        throw new Error('Risposta non valida durante la generazione del report');
      }
      setReport(risultato);
    } catch (erroreReport) {
      if (erroreReport instanceof ErroreValidazione) {
        setErroriCampo(erroriPerCampo(erroreReport.errori));
      } else {
        setErrore(erroreReport.message);
      }
    } finally {
      setInvio(false);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Report PSCL</Title1>
      <Card className={styles.scheda}>
        <Title2 as="h2">Genera statistiche aggregate</Title2>
        <form className={styles.modulo} onSubmit={generaReport} noValidate>
          <Field
            label="Sede dell'organizzazione"
            validationMessage={erroriCampo.sedeId}
            validationState={erroriCampo.sedeId ? 'error' : 'none'}
          >
            <Select
              name="sedeId"
              required
              value={dati.sedeId}
              disabled={caricamentoSedi || invio}
              onChange={(evento) => cambia('sedeId', evento.target.value)}
            >
              <option value="">Seleziona una sede</option>
              {sedi.map((sede) => (
                <option key={sede.id} value={sede.id}>{sede.nome}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Data di inizio"
            validationMessage={erroriCampo.dal}
            validationState={erroriCampo.dal ? 'error' : 'none'}
          >
            <Input
              name="dal"
              type="date"
              required
              value={dati.dal}
              disabled={invio}
              onChange={(evento) => cambia('dal', evento.target.value)}
            />
          </Field>
          <Field
            label="Data di fine"
            validationMessage={erroriCampo.al}
            validationState={erroriCampo.al ? 'error' : 'none'}
          >
            <Input
              name="al"
              type="date"
              required
              value={dati.al}
              disabled={invio}
              onChange={(evento) => cambia('al', evento.target.value)}
            />
          </Field>
          <div className={styles.azioni}>
            <Button appearance="primary" type="submit" disabled={invio || caricamentoSedi}>
              Genera report
            </Button>
          </div>
        </form>
        <Text>Il report mostra conteggi aggregati e anonimi per il periodo selezionato, fino a 12 mesi.</Text>
      </Card>

      {caricamentoSedi && <Spinner label="Caricamento sedi" />}
      {errore && <MessageBar intent="error"><MessageBarBody>{errore}</MessageBarBody></MessageBar>}
      {report && <ReportRisultati report={report} />}
    </section>
  );
}
