// Voci del menu in base al ruolo dell'utente.
import {
  Button,
  MessageBar,
  MessageBarBody,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { schermoCompatto } from '../styles/tema.js';
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
    gap: 'var(--spazio-2)',
    flexWrap: 'wrap',
    [schermoCompatto]: { display: 'none' },
  },
  mobile: {
    display: 'none',
    [schermoCompatto]: {
      display: 'inline-flex',
      flexShrink: 0,
    },
  },
  pulsanteMobile: { minWidth: '44px', minHeight: '44px' },
  voceMobile: {
    '&[aria-current="page"]': {
      backgroundColor: tokens.colorBrandBackground2,
      color: tokens.colorBrandForeground1,
    },
  },
  voce: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '44px',
    paddingInline: 'var(--spazio-2)',
    borderRadius: tokens.borderRadiusMedium,
    textDecoration: 'none',
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    ':hover': { backgroundColor: tokens.colorBrandBackground2 },
    '&[aria-current="page"]': {
      backgroundColor: tokens.colorBrandBackground2,
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    },
  },
  visitatoreAccedi: { border: `1px solid ${tokens.colorNeutralStroke2}` },
  visitatoreRegistrati: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': { backgroundColor: tokens.colorBrandBackgroundHover },
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
    <NavLink to={percorso} end={percorso === '/admin'} className={`${styles.voce} ${classeVisitatore}`}>
      {etichetta}
    </NavLink>
  );
}

export default function MenuRuolo() {
  const { utente, esci } = useUtente();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const styles = useStyles();
  const [erroreLogout, setErroreLogout] = useState('');

  async function gestisciLogout() {
    setErroreLogout('');
    try {
      await esci();
      navigate('/');
    } catch (errore) {
      setErroreLogout(errore.message);
    }
  }

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
          <Button appearance="subtle" onClick={gestisciLogout}>
            Esci
          </Button>
        )}
      </nav>
      <div className={styles.mobile}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button className={styles.pulsanteMobile} aria-label="Apri menu">☰</Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {voci.map((voce) => (
                <MenuItem
                  key={voce.percorso}
                  className={styles.voceMobile}
                  aria-current={matchPath({
                    path: voce.percorso,
                    end: voce.percorso === '/admin',
                  }, pathname) ? 'page' : undefined}
                  onClick={() => navigate(voce.percorso)}
                >
                  {voce.etichetta}
                </MenuItem>
              ))}
              {utente && <MenuItem onClick={gestisciLogout}>Esci</MenuItem>}
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      {erroreLogout && (
        <MessageBar intent="error">
          <MessageBarBody>{erroreLogout}</MessageBarBody>
        </MessageBar>
      )}
    </>
  );
}
