// Layout comune: intestazione con logo e menu, contenuto della pagina.
import { Text, Title3, makeStyles, tokens } from '@fluentui/react-components';
import { Link } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';
import MenuRuolo from './MenuRuolo.jsx';

const useStyles = makeStyles({
  radice: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  intestazione: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '10px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  marchio: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: tokens.colorBrandForeground1,
  },
  immagineLogo: {
    width: '36px',
    height: '32px',
    objectFit: 'contain',
  },
  nomeLogo: {
    color: '#117F60',
    fontSize: '28px',
    fontWeight: 700,
  },
  sottotitolo: {
    color: tokens.colorNeutralForeground2,
  },
  contenuto: {
    flex: 1,
    width: '100%',
    maxWidth: '1360px',
    margin: '0 auto',
    padding: '32px 36px',
  },
});

export default function Layout({ children }) {
  const styles = useStyles();
  const { utente } = useUtente();
  const destinazioneLogo = !utente
    ? '/'
    : utente.ruolo === 'Amministratore'
      ? '/admin'
      : '/home';

  return (
    <div className={styles.radice}>
      <header className={styles.intestazione}>
        <div className={styles.marchio}>
          <Link to={destinazioneLogo} className={styles.logo} aria-label="CarPool">
            <img
              src="/logo.svg"
              alt="Logo CarPool"
              className={styles.immagineLogo}
            />
            <Title3 as="span" className={styles.nomeLogo}>
              CarPool
            </Title3>
          </Link>
          {!utente && (
            <Text className={styles.sottotitolo}>
              Condividi il tragitto nella tua comunità
            </Text>
          )}
        </div>
        <MenuRuolo />
      </header>
      <main className={styles.contenuto}>{children}</main>
    </div>
  );
}
