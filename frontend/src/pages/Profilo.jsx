import {
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  Title1,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ErroreApi, ErroreValidazione, richiesta } from '../api/client.js';
import CampoModulo from '../components/CampoModulo.jsx';
import EliminaAccountDialog from '../components/EliminaAccountDialog.jsx';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: 'var(--spazio-4)' },
  contenuto: {
    display: 'grid',
    gridTemplateColumns: 'minmax(190px, 250px) minmax(0, 1fr)',
    gap: 'var(--spazio-4)',
    '@media (max-width: 700px)': { gridTemplateColumns: '1fr' },
  },
  navigazione: { display: 'flex', flexDirection: 'column', gap: 'var(--spazio-3)', padding: '20px' },
  link: { color: tokens.colorBrandForeground1, textUnderlineOffset: '3px', fontWeight: 600 },
  scheda: { display: 'flex', flexDirection: 'column', gap: '20px', padding: 'clamp(1rem, 3vw, 1.5rem)' },
  dati: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))', gap: 'var(--spazio-3)' },
  dato: { display: 'flex', flexDirection: 'column', gap: '4px' },
  modulo: { display: 'flex', flexDirection: 'column', gap: 'var(--spazio-3)', maxWidth: '520px' },
});
function Dato({ styles, etichetta, valore }) {
  return (
    <div className={styles.dato}>
      <Text weight="semibold">{etichetta}</Text>
      <Text>{valore || '—'}</Text>
    </div>
  );
}
function messaggiPerCampo(errori) {
  return errori.reduce((risultato, errore) => {
    risultato[errore.campo] = errore.messaggio;
    return risultato;
  }, {});
}
export default function Profilo() {
  const styles = useStyles();
  const percorso = useLocation().pathname;
  const paginaVeicolo = percorso === '/profilo/veicolo';
  const [profilo, setProfilo] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [erroreCaricamento, setErroreCaricamento] = useState('');
  const [modello, setModello] = useState('');
  const [colore, setColore] = useState('');
  const [posti, setPosti] = useState('');
  const [erroriCampo, setErroriCampo] = useState({});
  const [erroreInvio, setErroreInvio] = useState('');
  const [salvataggio, setSalvataggio] = useState(false);
  useEffect(() => {
    let attivo = true;
    richiesta('/api/profilo')
      .then((dati) => {
        if (attivo) setProfilo(dati);
      })
      .catch((errore) => {
        if (attivo) setErroreCaricamento(errore.message);
      })
      .finally(() => {
        if (attivo) setCaricamento(false);
      });
    return () => {
      attivo = false;
    };
  }, []);
  async function salvaVeicolo(evento) {
    evento.preventDefault();
    setErroriCampo({});
    setErroreInvio('');
    setSalvataggio(true);
    try {
      const veicolo = await richiesta('/api/profilo/veicolo', {
        metodo: 'POST',
        corpo: {
          modello,
          colore,
          numeroPostiPasseggeri: posti === '' ? null : Number(posti),
        },
      });
      setProfilo((corrente) => ({ ...corrente, veicolo }));
    } catch (errore) {
      if (errore instanceof ErroreValidazione) {
        setErroriCampo(messaggiPerCampo(errore.errori));
      } else if (errore instanceof ErroreApi && errore.stato === 409) {
        setErroreInvio(errore.message);
      } else {
        setErroreInvio(errore.message);
      }
    } finally {
      setSalvataggio(false);
    }
  }
  if (caricamento) return <Spinner label="Caricamento profilo" />;
  if (erroreCaricamento) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>{erroreCaricamento}</MessageBarBody>
      </MessageBar>
    );
  }
  if (!profilo) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Impossibile caricare il profilo.</MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">{paginaVeicolo ? 'Il mio veicolo' : 'Profilo e veicolo'}</Title1>
      <div className={styles.contenuto}>
        <Card className={styles.navigazione}>
          <Link className={styles.link} to="/profilo">Dati personali</Link>
          <Link className={styles.link} to="/profilo/veicolo">Il mio veicolo</Link>
          <Link className={styles.link} to="/prenotazioni">Le mie prenotazioni</Link>
        </Card>
        <Card className={styles.scheda}>
          {paginaVeicolo ? (
            <>
              <Text>Il numero di posti passeggeri non include il conducente.</Text>
              {profilo.veicolo ? (
                <div className={styles.dati}>
                  <Dato styles={styles} etichetta="Modello" valore={profilo.veicolo.modello} />
                  <Dato styles={styles} etichetta="Colore" valore={profilo.veicolo.colore} />
                  <Dato
                    styles={styles}
                    etichetta="Posti passeggeri"
                    valore={profilo.veicolo.numeroPostiPasseggeri}
                  />
                </div>
              ) : (
                <form className={styles.modulo} onSubmit={salvaVeicolo} noValidate>
                  <CampoModulo
                    etichetta="Modello"
                    nome="modello"
                    errore={erroriCampo.modello}
                    maxLength={100}
                    value={modello}
                    onChange={(evento) => setModello(evento.target.value)}
                  />
                  <CampoModulo
                    etichetta="Colore"
                    nome="colore"
                    errore={erroriCampo.colore}
                    maxLength={50}
                    value={colore}
                    onChange={(evento) => setColore(evento.target.value)}
                  />
                  <CampoModulo
                    etichetta="Posti passeggeri"
                    nome="numeroPostiPasseggeri"
                    errore={erroriCampo.numeroPostiPasseggeri}
                    type="number"
                    min={1}
                    step={1}
                    value={posti}
                    onChange={(evento) => setPosti(evento.target.value)}
                  />
                  {erroreInvio && (
                    <MessageBar intent="error" role="alert">
                      <MessageBarBody>{erroreInvio}</MessageBarBody>
                    </MessageBar>
                  )}
                  <Button appearance="primary" type="submit" disabled={salvataggio}>
                    Salva veicolo
                  </Button>
                </form>
              )}
            </>
          ) : (
            <>
              <Title2 as="h2">Dati personali</Title2>
              <div className={styles.dati}>
                <Dato styles={styles} etichetta="Nome" valore={profilo.nome} />
                <Dato styles={styles} etichetta="Cognome" valore={profilo.cognome} />
                <Dato styles={styles} etichetta="E-mail verificata" valore={profilo.email} />
                <Dato styles={styles} etichetta="Organizzazione" valore={profilo.organizzazione?.denominazione} />
              </div>
              <EliminaAccountDialog />
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
