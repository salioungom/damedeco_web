'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
} from '@mui/material';
import { ArrowBack as ArrowLeft } from '@mui/icons-material';

const steps = ['Récapitulatif', 'Finalisation'];

interface CheckoutHeaderProps {
  activeStep: number;
  onBack: () => void;
}

export function CheckoutHeader({ activeStep, onBack }: CheckoutHeaderProps) {
  const theme = useTheme();
  const brandBlue = theme.palette.primary.main;

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${alpha(brandBlue, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
        borderBottom: `1px solid ${alpha(brandBlue, 0.1)}`,
        pt: { xs: 10, sm: 11, md: 13, lg: 14 },
        pb: { xs: 2.5, sm: 3, md: 3.5, lg: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Button
          startIcon={<ArrowLeft sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />}
          onClick={onBack}
          sx={{
            mb: { xs: 1.5, sm: 2 },
            borderRadius: { xs: 2, sm: 2.25, md: 2.5 },
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: { xs: 14, sm: 15, md: 16 },
          }}
        >
          {activeStep === 0 ? 'Retour au panier' : 'Retour au récapitulatif'}
        </Button>

        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            fontSize: { xs: 26, sm: 28, md: 36, lg: 42.5 },
            letterSpacing: '-0.02em',
            mb: { xs: 1.25, sm: 1.5, md: 2 },
          }}
        >
          {activeStep === 0 ? 'Votre panier' : 'Finaliser la commande'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, maxWidth: 820 }}>
          Vérifiez vos informations de livraison et le mode de paiement avant de confirmer votre commande.
        </Typography>
        <Stepper
          activeStep={activeStep}
          sx={{
            maxWidth: { xs: '100%', sm: 625 },
            '& .MuiStepLabel-label': {
              fontWeight: 600,
              fontSize: { xs: 13, sm: 14.5, md: 16.25, lg: 17.5 },
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: brandBlue,
            },
            '& .MuiStepLabel-label.Mui-completed': {
              color: 'success.main',
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: brandBlue,
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: 'success.main',
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Container>
    </Box>
  );
}
