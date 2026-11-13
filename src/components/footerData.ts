export interface FooterLink {
  label: string;
  href: string;
}

export type SocialIconName = 'facebook' | 'instagram' | 'tiktok' | 'whatsapp';

export interface SocialLink {
  label: string;
  href: string;
  icon: SocialIconName;
}

export interface PaymentMethod {
  name: string;
  logo?: string;
  icon?: 'card' | 'cash';
  alt: string;
}

export const SITE = {
  name: 'DameDéco',
  tagline: 'Import & Commerce',
  description:
    'Importation de produits premium depuis la Chine. Votre partenaire de confiance à Dakar depuis 2010.',
  address: 'Dakar, Sénégal',
  phone: '+221 77 133 36 58',
  phoneTel: '+221771333658',
  email: 'damedeco1@gmail.com',
} as const;

export const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique', href: '/shop' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
] satisfies readonly FooterLink[];

export const ACCOUNT_LINKS = [
  { label: 'Connexion', href: '/login' },
  { label: 'Mes commandes', href: '/account/orders' },
  { label: 'Mes favoris', href: '/favorites' },
] satisfies readonly FooterLink[];

export const LEGAL_LINKS = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV', href: '/cgv' },
] satisfies readonly FooterLink[];

export const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com/damedeco', icon: 'facebook' },
  { label: 'Instagram', href: 'https://instagram.com/damedeco', icon: 'instagram' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@damedeco', icon: 'tiktok' },
] satisfies readonly SocialLink[];

export const PAYMENT_METHODS = [
  { name: 'Wave', logo: '/payment/wave.png', alt: 'Wave' },
  { name: 'Orange Money', logo: '/payment/om.jpg', alt: 'Orange Money' },
  { name: 'Carte bancaire', icon: 'card', alt: 'Carte bancaire' },
  { name: 'Espèces', icon: 'cash', alt: 'Paiement en espèces' },
] satisfies readonly PaymentMethod[];

export const MAX_CATEGORIES = 6;
