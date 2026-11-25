// Voci del menu in base al ruolo dell'utente.
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { NavLink, useNavigate } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';

const VOCI_MEMBRO = [
  { etichetta: 'Home', percorso: '/home' },
  { etichetta: 'Cerca viaggi', percorso: '/ricerca' },
  { etichetta: 'I miei viaggi', percorso: '/miei-viaggi' },
  { etichetta: 'Profilo e veicolo', percorso: '/profilo' },
];

const VOCI_ADMIN = [
  { etichetta: 'Dashboard', percorso: '/admin' },
  { etichetta: 'Organizzazioni', percorso: '/admin/organizzazioni' },
  { etichetta: 'Membri e ruoli', percorso: '/admin/membri' },
];

const useStyles = makeStyles({
  desktop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': { display: 'none' },
  },
  mobile: {
    display: 'none',
    '@media (max-width: 768px)': { display: 'inline-flex' },
  },
  voce: { textDecoration: 'none', color: tokens.colorBrandForeground1 },
  visitatoreAccedi: {
    padding: '12px 20px',
    border: '1px solid #E2E9E4',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    fontWeight: 600,
  },
  visitatoreRegistrati: {
    padding: '12px 20px',
    border: '1px solid #117F60',
    borderRadius: '8px',
    backgroundColor: '#117F60',
    color: '#FFFFFF',
    fontWeight: 600,
    ':hover': { backgroundColor: '#0E6D52' },
  },
});

function Voce({ etichetta, percorso, visitatore = false }) {
  const styles = useStyles();
  const classeVisitatore = visitatore
    ? etichetta === 'Registrati'
      ? styles.visitatoreRegistrati
      : styles.visitatoreAccedi
    : '';
  return (
    <NavLink to={percorso} className={`${styles.voce} ${classeVisitatore}`}>
      {etichetta}
    </NavLink>
  );
}

export default function MenuRuolo() {
  const { utente } = useUtente();
  const navigate = useNavigate();
  const styles = useStyles();

  let voci;
  if (!utente) {
    voci = [
      { etichetta: 'Accedi', percorso: '/login' },
      { etichetta: 'Registrati', percorso: '/registrazione' },
    ];
  } else if (utente.ruolo === 'Amministratore') {
    voci = VOCI_ADMIN;
  } else if (utente.ruolo === 'MobilityManager') {
    voci = [
      ...VOCI_MEMBRO.slice(0, 3),
      { etichetta: 'Report PSCL', percorso: '/report' },
      VOCI_MEMBRO[3],
    ];
  } else {
    voci = VOCI_MEMBRO;
  }

  return (
    <>
      <nav className={styles.desktop} aria-label="Menu principale">
        {voci.map((voce) => (
          <Voce key={voce.percorso} {...voce} visitatore={!utente} />
        ))}
        {utente && (
          <Button appearance="subtle" onClick={() => navigate('/')}>
            Esci
          </Button>
        )}
      </nav>
      <div className={styles.mobile}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button aria-label="Apri menu">☰</Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {voci.map((voce) => (
                <MenuItem key={voce.percorso} onClick={() => navigate(voce.percorso)}>
                  {voce.etichetta}
                </MenuItem>
              ))}
              {utente && <MenuItem onClick={() => navigate('/')}>Esci</MenuItem>}
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </>
  );
}
