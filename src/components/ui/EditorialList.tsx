'use client';

import { Box, Typography } from '@mui/material';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';

export interface EditorialItem {
  num: string;
  title: string;
  description: string;
}

interface EditorialListProps {
  items: EditorialItem[];
}

export function EditorialList({ items }: EditorialListProps) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item, index) => (
        <Box
          component="li"
          key={item.num}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' },
            gap: { xs: 1.25, sm: 4 },
            py: { xs: 3, sm: 4 },
            borderTop: index === 0 ? 'none' : `1px solid ${tokens.colors.border.light}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT_FRAUNCES,
              fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
              fontWeight: 600,
              lineHeight: 1.2,
              color: tokens.colors.accent.onLight,
            }}
          >
            {item.num}
          </Typography>
          <Box>
            <Typography component="h3" sx={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, color: 'text.primary', mb: 1 }}>
              {item.title}
            </Typography>
            <Typography sx={{ fontSize: 16, lineHeight: 1.75, color: 'text.secondary', maxWidth: '65ch' }}>
              {item.description}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default EditorialList;