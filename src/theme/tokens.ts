/**
 * Tokens de couleur — source unique du design system DameDéco.
 *
 * Chaque token documente : valeur, rôle, usage. Les composants NE contiennent
 * JAMAIS de couleur en dur : ils lisent ces tokens ou le thème MUI
 * (`theme.palette.*`).
 *
 * Règle 60/30/10 :
 *  - 60 % neutres  → `surfaces` + `text` (ivoire, blanc, sable)
 *  - 30 % marque   → `brand` (bleu aplat)
 *  - 10 % accent   → `accent` (laiton), jamais sur le texte courant
 *
 * Mode sombre (futur) : les groupes ci-dessous ont été pensés côté rôle pour
 * être branchés sur `colorSchemes` de `createTheme()` avec `cssVariables: true`
 * sans changement dans les composants. Ne pas activer tant que la migration
 * n'est pas validée.
 */
export const colors = {
  /* ─────────────────────────── Surfaces (60 % neutres) ─────────────────── */
  surfaces: {
    /** Fond de page principal — ivoire */
    default: '#faf7f2',
    /** Cartes, header, menus — blanc pur */
    paper: '#ffffff',
    /** Sections alternées — sable */
    alt: '#efe8dc',
    /** Sections inversées (footer, bandeaux devis) — encre */
    inverse: '#1e3a6e',
    /** Fond unique du footer — navy-800 */
    inverseFooter: '#173b70',
  },

  /* ─────────────────────────────── Texte ───────────────────────────────── */
  text: {
    /** Titres et texte courant (encre) */
    primary: '#111a2e',
    /** Descriptions, labels secondaires, legende */
    secondary: '#4a5568',
    /** Texte sur fond sombre (ivoire cassé) */
    onInverse: '#ffffff',
    /** Texte secondaire sur fond sombre — ratio ≥ 4.5:1 sur #14213D */
    onInverseMuted: '#c9d4e8',
    /** Liens et icônes du footer — contraste AA sur #173A66 */
    onFooter: '#c9d4e8',
    /** Descriptions, mentions et copyright du footer — contraste AA sur #173A66 */
    onFooterMuted: '#c9d4e8',
    /** Champs et liens désactivés */
    disabled: '#667085',
  },

  /* ─────────────────────── Marque — bleu aplat ─────────────────────────── */
  brand: {
    /** CTA principaux, liens, focus ring — toujours en aplat, jamais en dégradé */
    main: '#1e4a8a',
    /** Hover des contrôles primaires */
    hover: '#173b70',
    /** État actif / pressé */
    active: '#173b70',
    /** Aplat clair de marque (fonds de survol légers, avatars) */
    soft: '#eef3fa',
    /** Initiales « DS » du logo sur cercle blanc (variante claire du bleu de marque) — 8.2:1 sur blanc */
    mark: '#1e4a8a',
  },

  /* ─────────────────────── Accent — laiton (≤ 10 %) ────────────────────── */
  accent: {
    /** Filets fins, CTA des sections sombres, un mot d'accent par titre */
    main: '#7a5c26',
    /** Éclairci — texte/icônes sur fond sombre (ratio ≈ 7.4:1 sur encre) */
    onDark: '#e0b872',
    /** Assombri — petits textes/icônes sur fond clair (ratio ≈ 4.5:1 sur blanc) */
    onLight: '#7a5c26',
    /** Doré du footer — titres de colonnes, tagline, survols et focus */
    onFooter: '#e0b872',
  },

  /* ──────────────────────── Bordures / séparateurs ─────────────────────── */
  border: {
    /** Sur fond clair */
    light: '#e1ddd6',
    /** Sur fond sombre */
    onDark: 'rgba(255, 255, 255, 0.14)',
    /** Séparateur de la barre basse du footer */
    onFooter: 'rgba(255, 255, 255, 0.14)',
    /** Bordure des icônes sociales du footer */
    onFooterSocial: 'rgba(255, 255, 255, 0.2)',
  },

  /* ───────────────────────────── Sémantique ────────────────────────────── */
  status: {
    success: '#067647',
    successLight: '#e6f4ed',
    successDark: '#045b36',
    warning: '#B7791F',
    warningLight: '#A9862F',
    warningDark: '#6C5216',
    error: '#b42318',
    errorLight: '#fdecea',
    errorDark: '#8a1c13',
    /** Focus ring 2 px + offset 2 px */
    focus: '#1B4F8F',
  },

  /* ⚠️ Aliases legacy — conservés pour compatibilité, migrer progressivement.
     - `brand`/`border` (groupes) ont des alias dédiés `brandBlue`/`borderLine`
       pour éviter tout conflit de nom dans l'objet `colors`. */
  ivory: '#faf7f2',
  white: '#ffffff',
  sand: '#efe8dc',
  ink: '#111a2e',
  inkMuted: '#4a5568',
  brandBlue: '#1e4a8a',
  brandDark: '#173b70',
  brandSoft: '#eef3fa',
  laiton: '#7a5c26',
  borderLine: '#e1ddd6',
  error: '#b42318',
  success: '#067647',
  warning: '#B7791F',
  disabled: '#A9A29A',
} as const;

export const radius = {
  field: 8,
  control: 8,
  card: 12,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const fieldHeight = 48;
export const borderWidth = 1;
export const focusRingWidth = 2;
export const focusRingOffset = 2;

export const tokens = {
  colors,
  radius,
  fontSize,
  fieldHeight,
  borderWidth,
  focusRingWidth,
  focusRingOffset,
} as const;

export default tokens;