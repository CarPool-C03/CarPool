import { Button, Card, Field, Input, Select, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  filtri: { display: 'flex', flexDirection: 'column', gap: 'var(--spazio-3)', padding: 'clamp(1rem, 3vw, 2rem)' },
  modulo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))',
    gap: 'var(--spazio-3)',
    alignItems: 'end',
  },
});

export default function FiltroRicerca({
  filtri,
  sedi,
  errori,
  caricamento,
  caricamentoSedi,
  onCambia,
  onInvia,
}) {
  const styles = useStyles();

  return (
    <Card className={styles.filtri}>
      <form className={styles.modulo} onSubmit={onInvia}>
        <Field
          label="Zona di partenza"
          validationMessage={errori.zona}
          validationState={errori.zona ? 'error' : 'none'}
        >
          <Input
            name="zona"
            required
            value={filtri.zona}
            onChange={(e) => onCambia('zona', e.target.value)}
          />
        </Field>
        <Field
          label="Sede di destinazione"
          validationMessage={errori.sedeId}
          validationState={errori.sedeId ? 'error' : 'none'}
        >
          <Select
            name="sedeId"
            required
            value={filtri.sedeId}
            onChange={(e) => onCambia('sedeId', e.target.value)}
          >
            <option value="">
              {caricamentoSedi ? 'Caricamento sedi…' : 'Seleziona una sede'}
            </option>
            {sedi.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Data"
          validationMessage={errori.data}
          validationState={errori.data ? 'error' : 'none'}
        >
          <Input
            name="data"
            type="date"
            required
            value={filtri.data}
            onChange={(e) => onCambia('data', e.target.value)}
          />
        </Field>
        <Field
          label="Orario minimo"
          validationMessage={errori.orarioMinimo}
          validationState={errori.orarioMinimo ? 'error' : 'none'}
        >
          <Input
            name="orarioMinimo"
            type="time"
            required
            value={filtri.orarioMinimo}
            onChange={(e) => onCambia('orarioMinimo', e.target.value)}
          />
        </Field>
        <Button appearance="primary" type="submit" disabled={caricamento}>
          Cerca
        </Button>
      </form>
    </Card>
  );
}
