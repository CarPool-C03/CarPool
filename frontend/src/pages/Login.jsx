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
import CampoModulo from '../components/CampoModulo.jsx';
import { useUtente } from '../auth/UtenteContext.jsx';

const useStyles = makeStyles({
  pagina: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
    alignItems: 'center',
    maxWidth: '960px',
    margin: '0 auto',
  },
  introduzione: { display: 'flex', flexDirection: 'column', gap: '16px' },
  modulo: { padding: '28px' },
  campi: { display: 'flex', flexDirection: 'column', gap: '18px' },
  link: { color: '#117F60', fontWeight: 600, textDecoration: 'none' },
});

export default function Login() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { accedi } = useUtente();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setInvio(true);
    try {
      const utente = await accedi(email, password);
      navigate(utente.ruolo === 'Amministratore' ? '/admin' : '/home');
    } catch (erroreAccesso) {
      setErrore(erroreAccesso.message);
    } finally {
      setInvio(false);
    }
  }

  return (
    <section className={styles.pagina}>
      <div className={styles.introduzione}>
        <Title1 as="h1">Login</Title1>
        <Text>Bentornato in CarPool.</Text>
        <Text>Puoi accedere dopo aver verificato l’e-mail della tua organizzazione.</Text>
      </div>
      <Card className={styles.modulo}>
        <Title2 as="h2">Accedi a CarPool</Title2>
        {errore && (
          <MessageBar intent="error" role="alert">
            <MessageBarBody>{errore}</MessageBarBody>
          </MessageBar>
        )}
        <form onSubmit={invia}>
          <div className={styles.campi}>
            <CampoModulo
              etichetta="E-mail istituzionale / aziendale"
              nome="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
            <CampoModulo
              etichetta="Password"
              nome="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
            <Button appearance="primary" type="submit" disabled={invio}>
              Accedi
            </Button>
            <Text>
              Non hai un account?{' '}
              <Link className={styles.link} to="/registrazione">
                Registrati
              </Link>
            </Text>
          </div>
        </form>
      </Card>
    </section>
  );
}
