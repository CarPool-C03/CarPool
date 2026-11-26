import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  avviso: {
    padding: 'var(--spazio-3)',
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
  },
});

export default function AvvisoErrore({ children }) {
  const styles = useStyles();
  return <div className={styles.avviso} role="alert">{children}</div>;
}
