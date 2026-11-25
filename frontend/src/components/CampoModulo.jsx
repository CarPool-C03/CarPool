// Campo di modulo riusabile: etichetta, input e messaggio di errore sotto il campo.
import { Field, Input } from '@fluentui/react-components';

export default function CampoModulo({ etichetta, nome, errore, ...props }) {
  return (
    <Field
      label={etichetta}
      validationMessage={errore}
      validationState={errore ? 'error' : 'none'}
    >
      <Input id={nome} name={nome} aria-invalid={errore ? true : undefined} {...props} />
    </Field>
  );
}
