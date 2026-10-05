import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    pool: 'threads',
    environment: 'jsdom',
    globals: true,
    // Amorce l'environnement (MUI/Emotion/jsdom) hors du budget `testTimeout`.
    // Voir src/test-setup.tsx : sans cela, le premier test de chaque fichier
    // « écran » payait ~4,7 s d'amorçage CSSOM sur un budget de 5 s et échouait
    // en « Test timed out » de façon aléatoire.
    setupFiles: ['./src/test-setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Complément du préchauffage : le second levier est la contention. Chaque
    // worker parses sa propre feuille de styles Emotion via le CSSOM de jsdom,
    // ce qui sature les cœurs et rallonge chaque test de plusieurs centaines de
    // ms. Mesuré sur 4 cœurs : 3 workers → timeouts, 2 workers → suite verte.
    // `50%` laisse la moitié des cœurs au pool et au thread principal, et reste
    // portable (8 cœurs → 4 workers, 16 cœurs → 8).
    fileParallelism: false,
  },
});
