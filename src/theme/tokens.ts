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
    default: '#F7F3EC',
    /** Cartes, header, menus — blanc pur */
    paper: '#FFFFFF',
    /** Sections alternées — sable */
    alt: '#EDE6DA',
    /** Sections inversées (footer, bandeaux devis) — encre */
    inverse: '#14213D',
    /** Fond unique du footer — navy-800 */
    inverseFooter: '#173A66',
  },

  /* ─────────────────────────────── Texte ───────────────────────────────── */
  text: {
    /** Titres et texte courant (encre) */
    primary: '#14213D',
    /** Descriptions, labels secondaires, legende */
    secondary: '#5B6478',
    /** Texte sur fond sombre (ivoire cassé) */
    onInverse: '#F7F3EC',
    /** Texte secondaire sur fond sombre — ratio ≥ 4.5:1 sur #14213D */
    onInverseMuted: '#C9CFDC',
    /** Liens et icônes du footer — contraste AA sur #173A66 */
    onFooter: '#D5DEEB',
    /** Descriptions, mentions et copyright du footer — contraste AA sur #173A66 */
    onFooterMuted: '#B4C2D6',
    /** Champs et liens désactivés */
    disabled: '#A9A29A',
  },

  /* ─────────────────────── Marque — bleu aplat ─────────────────────────── */
  brand: {
    /** CTA principaux, liens, focus ring — toujours en aplat, jamais en dégradé */
    main: '#1B4F8F',
    /** Hover des contrôles primaires */
    hover: '#163F73',
    /** État actif / pressé */
    active: '#12345E',
    /** Aplat clair de marque (fonds de survol légers, avatars) */
    soft: '#E7EEF6',
    /** Initiales « DS » du logo sur cercle blanc (variante claire du bleu de marque) — 8.2:1 sur blanc */
    mark: '#1E4F8F',
  },

  /* ─────────────────────── Accent — laiton (≤ 10 %) ────────────────────── */
  accent: {
    /** Filets fins, CTA des sections sombres, un mot d'accent par titre */
    main: '#B8894A',
    /** Éclairci — texte/icônes sur fond sombre (ratio ≈ 7.4:1 sur encre) */
    onDark: '#D4A968',
    /** Assombri — petits textes/icônes sur fond clair (ratio ≈ 4.5:1 sur blanc) */
    onLight: '#96703A',
    /** Doré du footer — titres de colonnes, tagline, survols et focus */
    onFooter: '#E0B76C',
  },

  /* ──────────────────────── Bordures / séparateurs ─────────────────────── */
  border: {
    /** Sur fond clair */
    light: '#DDD5C7',
    /** Sur fond sombre */
    onDark: 'rgba(247, 243, 236, 0.14)',
    /** Séparateur de la barre basse du footer */
    onFooter: 'rgba(255, 255, 255, 0.14)',
    /** Bordure des icônes sociales du footer */
    onFooterSocial: 'rgba(255, 255, 255, 0.2)',
  },

  /* ───────────────────────────── Sémantique ────────────────────────────── */
  status: {
    success: '#2E7D5B',
    warning: '#B7791F',
    error: '#B42318',
    /** Focus ring 2 px + offset 2 px */
    focus: '#1B4F8F',
  },

  /* ⚠️ Aliases legacy — conservés pour compatibilité, migrer progressivement.
     - `brand`/`border` (groupes) ont des alias dédiés `brandBlue`/`borderLine`
       pour éviter tout conflit de nom dans l'objet `colors`. */
  ivory: '#F7F3EC',
  white: '#FFFFFF',
  sand: '#EDE6DA',
  ink: '#14213D',
  inkMuted: '#5B6478',
  brandBlue: '#1B4F8F',
  brandDark: '#163F73',
  brandSoft: '#E7EEF6',
  laiton: '#B8894A',
  borderLine: '#DDD5C7',
  error: '#B42318',
  success: '#2E7D5B',
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