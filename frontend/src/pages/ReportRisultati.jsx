import {
  Card,
  MessageBar,
  MessageBarBody,
  Text,
  Title2,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  totali: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))', gap: 'var(--spazio-3)' },
  totale: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: 'var(--spazio-3)', padding: 'clamp(1rem, 3vw, 1.5rem)' },
  tabella: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  numero: { color: tokens.colorBrandForeground1, fontVariantNumeric: 'tabular-nums' },
  cella: {
    padding: 'clamp(0.25rem, 1.5vw, 0.75rem)',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

export default function ReportRisultati({ report }) {
  const styles = useStyles();
  const metriche = [
    ['Viaggi condivisi', report.totali.viaggiCondivisi],
    ['Posti offerti', report.totali.postiOfferti],
    ['Passeggeri trasportati', report.totali.passeggeriTrasportati],
  ];

  return (
    <>
      {report.avviso && (
        <MessageBar intent="warning"><MessageBarBody>{report.avviso}</MessageBarBody></MessageBar>
      )}
      <section className={styles.totali} aria-label="Totali del report">
        {metriche.map(([etichetta, valore]) => (
          <Card key={etichetta} className={styles.totale}>
            <Title3 as="h2">{etichetta}</Title3>
            <Text size={800} weight="bold" className={styles.numero}>{valore}</Text>
            <Text>Nel periodo selezionato</Text>
          </Card>
        ))}
      </section>
      <Card className={styles.scheda}>
        <Title2 as="h2">Report per mese</Title2>
        <table className={styles.tabella} aria-label="Report mensile">
          <thead>
            <tr>
              {['Mese', 'Viaggi condivisi', 'Posti offerti', 'Passeggeri trasportati'].map((titolo) => (
                <th className={styles.cella} key={titolo} scope="col">{titolo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.mesi.length === 0 ? (
              <tr><td className={styles.cella} colSpan={4}>Nessun dato mensile per il periodo selezionato.</td></tr>
            ) : report.mesi.map((mese) => (
              <tr key={mese.mese}>
                <td className={styles.cella}>{mese.mese}</td>
                <td className={styles.cella}>{mese.viaggiCondivisi}</td>
                <td className={styles.cella}>{mese.postiOfferti}</td>
                <td className={styles.cella}>{mese.passeggeriTrasportati}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
