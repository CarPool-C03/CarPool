// Matcher di Testing Library per Vitest (es. toBeInTheDocument) e pulizia dopo ogni test.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
