// Phone validation utilities for Senegal (+221) and Gambia (+220)

export const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return "Le numéro de téléphone est requis";
  }

  // Tout nettoyer : garder uniquement les chiffres
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) {
    return "Le numéro de téléphone est requis";
  }

  let countryPrefix: string;
  let localNumber: string;

  if (digits.startsWith('221')) {
    countryPrefix = '221';
    localNumber = digits.substring(3);
  } else if (digits.startsWith('220')) {
    countryPrefix = '220';
    localNumber = digits.substring(3);
  } else if (digits.length === 9) {
    // Pas d'indicatif → défaut Sénégal
    countryPrefix = '221';
    localNumber = digits;
  } else if (digits.length === 7) {
    // Pas d'indicatif → Gambie
    countryPrefix = '220';
    localNumber = digits;
  } else {
    return "Format invalide. Utilisez +221XXXXXXXXX (Sénégal) ou +220XXXXXXX (Gambie)";
  }

  // Validation Sénégal
  if (countryPrefix === '221') {
    if (localNumber.length !== 9) {
      return "Format invalide: +221 suivi de 9 chiffres";
    }
    const validSenegalOperators = ['77', '78', '76', '70', '75', '33', '30'];
    if (!validSenegalOperators.includes(localNumber.substring(0, 2))) {
      return `Opérateur invalide. Valides: ${validSenegalOperators.join(', ')}`;
    }
  }

  // Validation Gambie
  if (countryPrefix === '220') {
    if (localNumber.length !== 7) {
      return "Format invalide: +220 suivi de 7 chiffres";
    }
    const validGambiaOperators = ['30', '39', '99', '77', '88', '55', '22'];
    if (!validGambiaOperators.includes(localNumber.substring(0, 2))) {
      return `Opérateur invalide. Valides: ${validGambiaOperators.join(', ')}`;
    }
  }

  return null;
};

export const formatPhoneInput = (value: string): string => {
  // Enlever tout sauf les chiffres et le +
  let cleaned = value.replace(/[^\d+]/g, '');

  // Ajouter automatiquement +221 si l'utilisateur commence par un chiffre
  if (!cleaned.startsWith('+') && cleaned.length > 0) {
    cleaned = '+221' + cleaned;
  }

  // Formatage visuel avec espaces (optionnel)
  if (cleaned.startsWith('+221') && cleaned.length > 4) {
    cleaned = cleaned.replace(/(\+221)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  } else if (cleaned.startsWith('+220') && cleaned.length > 4) {
    cleaned = cleaned.replace(/(\+220)(\d{2})(\d{3})(\d{2})/, '$1 $2 $3 $4');
  }

  return cleaned;
};

export const detectCountry = (phone: string): 'SN' | 'GM' | null => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('221')) return 'SN';
  if (digits.startsWith('220')) return 'GM';
  if (digits.length === 9) return 'SN';
  if (digits.length === 7) return 'GM';
  return null;
};

export const getOperators = (country: 'SN' | 'GM'): string[] => {
  if (country === 'SN') {
    return ['77', '78', '76', '70', '75', '33', '30'];
  }
  return ['30', '39', '99', '77', '88', '55', '22'];
};
