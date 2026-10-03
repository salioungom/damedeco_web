'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthCheck?: (strength: any) => void;
}

interface PasswordStrength {
  score: number;
  feedback: {
    warning?: string;
    suggestions: string[];
  };
}

export function PasswordStrengthMeter({ password, onStrengthCheck }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const calculateStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    const suggestions: string[] = [];

    if (pwd.length >= 8) score += 1;
    else suggestions.push('Ajoutez au moins 8 caractères');

    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    else suggestions.push('Mélangez majuscules et minuscules');

    if (/\d/.test(pwd)) score += 1;
    else suggestions.push('Ajoutez des chiffres');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;
    else suggestions.push('Ajoutez des caractères spéciaux');

    if (pwd.length >= 12) score += 1;

    return {
      score: Math.min(score, 4),
      feedback: {
        suggestions,
      },
    };
  };

  useEffect(() => {
    if (!password) {
      setStrength(null);
      return;
    }

    const checkStrength = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/password/strength`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        });

        const data = await response.json();
        if (response.ok) {
          setStrength(data);
          onStrengthCheck?.(data);
        }
      } catch (err) {
        // Fallback to client-side calculation
        const fallbackStrength = calculateStrength(password);
        setStrength(fallbackStrength);
        onStrengthCheck?.(fallbackStrength);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(checkStrength, 300);
    return () => clearTimeout(timeoutId);
  }, [password, onStrengthCheck]);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return theme.palette.error.main;
    if (score <= 2) return theme.palette.warning.main;
    if (score <= 3) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return 'Faible';
    if (score <= 2) return 'Moyen';
    if (score <= 3) return 'Fort';
    return 'Très fort';
  };

  if (!password) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          Force du mot de passe: {strength ? getStrengthLabel(strength.score) : 'Vérification...'}
        </Typography>
        {strength && (
          <Typography
            variant="body2"
            sx={{ color: getStrengthColor(strength.score), fontWeight: 'bold' }}
          >
            {strength.score}/4
          </Typography>
        )}
      </Box>

      <LinearProgress
        variant={loading ? 'indeterminate' : 'determinate'}
        value={strength ? (strength.score / 4) * 100 : 0}
        sx={{
          height: 10,
          borderRadius: 4,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            backgroundColor: strength ? getStrengthColor(strength.score) : theme.palette.grey[400],
          },
          mb: 2,
        }}
      />

      {strength && strength.feedback.suggestions.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Suggestions pour améliorer:
          </Typography>
          <List dense>
            {strength.feedback.suggestions.map((suggestion, index) => (
              <ListItem key={index} sx={{ py: 0, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <CloseIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />
                </ListItemIcon>
                <ListItemText
                  primary={suggestion}
                  slotProps={{
                    primary: {
                      variant: 'body2',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {strength && strength.score >= 3 && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CheckIcon sx={{ fontSize: 20, color: theme.palette.success.main, mr: 1 }} />
          <Typography variant="body2" color={theme.palette.success.main}>
            Mot de passe sécurisé
          </Typography>
        </Box>
      )}
    </Box>
  );
}
