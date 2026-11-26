// Layout comune: intestazione, navigazione e contenuto della pagina.
import { makeStyles, tokens } from '@fluentui/react-components';
import { Link } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';
import { schermoCompatto } from '../styles/tema.js';
import MenuRuolo from './MenuRuolo.jsx';
import TitoloPagina from './TitoloPagina.jsx';

const useStyles = makeStyles({
  intestazione: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  barra: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--spazio-3)',
    flexWrap: 'wrap',
    maxWidth: 'var(--larghezza-pagina)',
    margin: '0 auto',
    padding: 'var(--spazio-2) var(--margine-pagina)',
  },
  marchio: { display: 'flex', alignItems: 'center', gap: 'var(--spazio-3)' },
  sottotitolo: {
    color: tokens.colorNeutralForeground2,
    [schermoCompatto]: { display: 'none' },
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spazio-1)',
    textDecoration: 'none',
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
  },
  immagineLogo: { width: '44px', height: '44px', objectFit: 'contain' },
  salta: {
    position: 'absolute',
    zIndex: 2,
    left: 'var(--margine-pagina)',
    top: 'var(--spazio-1)',
    transform: 'translateY(-200%)',
    padding: 'var(--spazio-2)',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
    ':focus': { transform: 'none' },
  },
  contenuto: {
    maxWidth: 'var(--larghezza-pagina)',
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 3rem) var(--margine-pagina)',
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
    <>
      <TitoloPagina />
      <a href="#contenuto-principale" className={styles.salta}>Vai al contenuto</a>
      <header className={styles.intestazione}>
        <div className={styles.barra}>
          <div className={styles.marchio}>
            <Link to={destinazioneLogo} className={styles.logo} aria-label="CarPool">
              <img src="/CARPOOL.png" alt="Logo CarPool" width="44" height="44" className={styles.immagineLogo} />
              CarPool
            </Link>
            {!utente && <span className={styles.sottotitolo}>Condividi il tragitto nella tua comunità</span>}
          </div>
          <MenuRuolo />
        </div>
      </header>
      <main id="contenuto-principale" tabIndex={-1} className={styles.contenuto}>
        {children}
      </main>
    </>
  );
}
