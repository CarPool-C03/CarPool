import {
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Text,
  Title1,
  Title2,
  makeStyles,
} from '@fluentui/react-components';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErroreValidazione, richiesta } from '../api/client.js';
import CampoModulo from '../components/CampoModulo.jsx';

const useStyles = makeStyles({
  pagina: { maxWidth: '640px', margin: '0 auto' },
  modulo: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' },
  campi: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px',
    '@media (max-width: 520px)': { gridTemplateColumns: '1fr' },
  },
  interaRiga: {
    gridColumn: '1 / -1',
    '@media (max-width: 520px)': { gridColumn: 'auto' },
  },
  link: { color: '#117F60', fontWeight: 600, textDecoration: 'none' },
  nota: { color: '#61736B' },
});

export default function Registrazione() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [dati, setDati] = useState({ nome: '', cognome: '', email: '', password: '' });
  const [errori, setErrori] = useState({});
  const [erroreGenerale, setErroreGenerale] = useState('');
  const [invio, setInvio] = useState(false);

  function aggiorna(evento) {
    const { name, value } = evento.target;
    setDati((correnti) => ({ ...correnti, [name]: value }));
    setErrori((correnti) => ({ ...correnti, [name]: undefined }));
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrori({});
    setErroreGenerale('');
    setInvio(true);
    try {
      await richiesta('/api/account/registrazione', { metodo: 'POST', corpo: dati });
      navigate('/registrazione/inviata');
    } catch (errore) {
      if (errore instanceof ErroreValidazione) {
        setErrori(Object.fromEntries(errore.errori.map(({ campo, messaggio }) => [campo, messaggio])));
      } else {
        setErroreGenerale(errore.message);
      }
    } finally {
      setInvio(false);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Registrazione</Title1>
      <Card className={styles.modulo}>
        <Title2 as="h2">Crea un account</Title2>
        {erroreGenerale && (
          <MessageBar intent="error" role="alert">
            <MessageBarBody>{erroreGenerale}</MessageBarBody>
          </MessageBar>
        )}
        <form onSubmit={invia}>
          <div className={styles.campi}>
            <CampoModulo
              etichetta="Nome"
              nome="nome"
              autoComplete="given-name"
              required
              maxLength={100}
              value={dati.nome}
              errore={errori.nome}
              onChange={aggiorna}
            />
            <CampoModulo
              etichetta="Cognome"
              nome="cognome"
              autoComplete="family-name"
              required
              maxLength={100}
              value={dati.cognome}
              errore={errori.cognome}
              onChange={aggiorna}
            />
            <div className={styles.interaRiga}>
              <CampoModulo
                etichetta="E-mail istituzionale / aziendale"
                nome="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={dati.email}
                errore={errori.email}
                onChange={aggiorna}
              />
            </div>
            <div className={styles.interaRiga}>
              <CampoModulo
                etichetta="Password"
                nome="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={dati.password}
                errore={errori.password}
                onChange={aggiorna}
              />
            </div>
            <Button appearance="primary" type="submit" disabled={invio}>
              Crea account
            </Button>
          </div>
        </form>
        <Text className={styles.nota}>Riceverai un link via e-mail per verificare il tuo indirizzo.</Text>
        <Text>
          Hai già un account?{' '}
          <Link className={styles.link} to="/login">
            Accedi
          </Link>
        </Text>
      </Card>
    </section>
  );
}
