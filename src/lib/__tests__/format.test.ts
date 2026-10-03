import { describe, it, expect } from 'vitest';
import { formatFcfa } from '../format';

// Intl.NumberFormat('fr-FR') groupe les milliers avec une espace fine
// insécable (U+202F) sur Node 18+/cr. Comparer à ce caractère explicite.
const NARROW = '\u202F';

describe('formatFcfa', () => {
  it('formate 0', () => {
    expect(formatFcfa(0)).toBe(`0 FCFA`);
  });

  it('formate 1500', () => {
    expect(formatFcfa(1500)).toBe(`1${NARROW}500 FCFA`);
  });

  it('formate 12900 (exemple du brief)', () => {
    expect(formatFcfa(12900)).toBe(`12${NARROW}900 FCFA`);
  });

  it('formate 1234567', () => {
    expect(formatFcfa(1234567)).toBe(`1${NARROW}234${NARROW}567 FCFA`);
  });

  it('accepte les montants fournis en chaîne par l’API', () => {
    expect(formatFcfa('12900')).toBe(`12${NARROW}900 FCFA`);
  });

  it('retourne "—" pour null', () => {
    expect(formatFcfa(null)).toBe('—');
  });

  it('retourne "—" pour undefined', () => {
    expect(formatFcfa(undefined)).toBe('—');
  });

  it('retourne "—" pour une chaîne vide', () => {
    expect(formatFcfa('')).toBe('—');
  });

  it('retourne "—" pour une valeur non numérique', () => {
    expect(formatFcfa('abc')).toBe('—');
    expect(formatFcfa(Number.NaN)).toBe('—');
    expect(formatFcfa(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('arrondit sans décimale (ex. 12900.6)', () => {
    expect(formatFcfa(12900.6)).toBe(`12${NARROW}901 FCFA`);
  });
});