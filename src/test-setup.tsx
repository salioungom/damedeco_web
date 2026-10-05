/**
 * @file /src/test-setup.tsx
 * @description Préchauffage de l'environnement de test (MUI + Emotion + jsdom).
 *
 * Pourquoi ce fichier existe
 * -------------------------
 * jsdom implémente CSSOM de façon quadratique : chaque nouvelle règle insérée
 * dans une feuille `<style>` provoque un re-parse complet de la feuille. Emotion
 * (le moteur de style de MUI) insère une règle par combinaison de styles, et un
 * premier rendu d'écran MUI en insère plusieurs centaines. Conséquence mesurée
 * sur `settings-password-page.test.tsx` : son PREMIER test prenait 4,7 s sur un
 * budget `testTimeout` de 5 s, alors que les suivants du même fichier prenaient
 * 1,1 à 2,5 s. Ce n'était donc pas de la contention CPU ni un défaut du test,
 * mais un coût d'amorçage d'une seule fois, imputé au premier test du fichier —
 * d'où des « Test timed out » aléatoires selon la machine et la charge.
 *
 * Ce fichier rend une fois un arbre représentatif des écrans les plus lourds
 * (Paper, Alert, TextField, Button), puis le démonte. L'amorçage se fait ici,
 * dans `setupFiles`, donc HORS du budget de `testTimeout` : les tests ne
 * conservent que leur propre travail. Aucun timeout n'est modifié et aucune
 * assertion n'est affaiblie.
 *
 * Effet mesuré : 4 704 ms → 2 906 ms sur le test le plus lent, soit une marge
 * de 42 % au lieu de 6 % sous le budget de 5 s. Le reste de la suite est
 * également accéléré (1 380 ms → 1 152 ms, 1 469 ms → 1 245 ms, …).
 */

import { render, cleanup } from '@testing-library/react';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

render(
    <Paper variant="outlined">
        <Alert severity="success" variant="outlined">Amorçage</Alert>
        <TextField label="Amorçage" defaultValue="" />
        <Button disabled>Modification…</Button>
    </Paper>
);

cleanup();
