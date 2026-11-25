import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import CampoModulo from './CampoModulo.jsx';

describe('CampoModulo', () => {
  test("Modulo: mostra l'errore sotto il campo sbagliato", () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <CampoModulo etichetta="E-mail" nome="email" errore="E-mail non valida" />
        <CampoModulo etichetta="Password" nome="password" errore="Password troppo corta" />
      </FluentProvider>,
    );

    const email = screen.getByLabelText('E-mail');
    const password = screen.getByLabelText('Password');
    const erroreEmail = screen.getByText('E-mail non valida');
    const errorePassword = screen.getByText('Password troppo corta');

    expect(email).toHaveAttribute('aria-describedby', erroreEmail.id);
    expect(password).toHaveAttribute('aria-describedby', errorePassword.id);
    expect(email.getAttribute('aria-describedby')).not.toBe(errorePassword.id);
    expect(password.getAttribute('aria-describedby')).not.toBe(erroreEmail.id);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-invalid', 'true');
  });
});
