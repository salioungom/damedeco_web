import { Box, Typography } from '@mui/material';
import { CreditCardOutlined, PaymentsOutlined } from '@mui/icons-material';
import { PAYMENT_METHODS } from './footerData';
import {
  paymentBadgesSx,
  paymentBadgeSx,
  sectionHeadingSx,
} from './footerStyles';

export function FooterPayments() {
  return (
    <Box component="nav" aria-label="Moyens de paiement">
      <Typography component="h2" sx={sectionHeadingSx}>
        Moyens de paiement
      </Typography>
      <Box
        component="ul"
        aria-label="Moyens de paiement"
        sx={paymentBadgesSx}
      >
        {PAYMENT_METHODS.map((method) => (
          <Box component="li" key={method.name} aria-label={method.alt}>
            <Box
              role={method.logo ? 'img' : undefined}
              aria-label={method.logo ? method.alt : undefined}
              sx={paymentBadgeSx}
            >
              {method.logo ? (
                <Box
                  component="img"
                  src={method.logo}
                  alt=""
                  aria-hidden="true"
                  width={44}
                  height={28}
                />
              ) : method.icon === 'card' ? (
                <CreditCardOutlined aria-hidden="true" />
              ) : (
                <PaymentsOutlined aria-hidden="true" />
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
