import { Box, Typography } from '@mui/material';
import { SITE } from './footerData';
import {
  brandDescriptionSx,
  brandMarkSx,
  brandNameSx,
  brandStackSx,
  brandTaglineSx,
} from './footerStyles';

export function FooterBrand() {
  return (
    <Box>
      <Box sx={brandStackSx}>
        <Box aria-hidden="true" sx={brandMarkSx}>
          DS
        </Box>
        <Box>
          <Typography component="p" sx={brandNameSx}>
            {SITE.name}
          </Typography>
          <Typography component="p" sx={brandTaglineSx}>
            {SITE.tagline}
          </Typography>
        </Box>
      </Box>
      <Typography component="p" sx={brandDescriptionSx}>
        {SITE.description}
      </Typography>
    </Box>
  );
}
