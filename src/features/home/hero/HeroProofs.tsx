import {
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  WorkspacePremiumOutlined as QualityIcon,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import styles from './HeroSection.module.css';
import {
  heroProofIconSx,
  heroProofItemSx,
  heroProofTextSx,
  heroProofsSx,
} from './heroStyles';

type ProofIconName = 'delivery' | 'quality' | 'payment';

export interface HeroProof {
  icon: ProofIconName;
  text: string;
}

const proofIcons = {
  delivery: DeliveryIcon,
  quality: QualityIcon,
  payment: PaymentIcon,
} satisfies Record<ProofIconName, typeof DeliveryIcon>;

export default function HeroProofs({ proofs }: { proofs: readonly HeroProof[] }) {
  return (
    <Box sx={heroProofsSx}>
      {proofs.map((proof) => {
        const Icon = proofIcons[proof.icon];

        return (
          <Box key={proof.text} sx={heroProofItemSx}>
            <Icon
              className={styles.entranceItem}
              data-hero="bullet"
              strokeWidth={1.5}
              sx={heroProofIconSx}
              aria-hidden="true"
            />
            <Typography
              className={styles.entranceItem}
              data-hero="bullet"
              sx={heroProofTextSx}
            >
              {proof.text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
