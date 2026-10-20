'use client';

import { type ComponentProps } from 'react';
import { TextField } from '@mui/material';
import { tokens } from '@/theme/tokens';

export const staticLabelSx = {
  position: 'static',
  transform: 'none',
  maxWidth: 'none',
  fontSize: tokens.fontSize.sm,
  fontWeight: 500,
  lineHeight: '20px',
  marginBottom: '8px',
  color: tokens.colors.ink,
  '&.Mui-focused': {
    color: tokens.colors.brand.main,
  },
  '&.Mui-error': {
    color: tokens.colors.error,
  },
};

export const staticInputSx = {
  height: 48,
  padding: '0 14px',
  boxSizing: 'border-box',
  fontSize: 16,
};

export function StaticTextField({ slotProps, sx, ...rest }: ComponentProps<typeof TextField>) {
  return (
    <TextField
      {...rest}
      variant="outlined"
      fullWidth
      slotProps={{
        ...slotProps,
        inputLabel: {
          ...(slotProps?.inputLabel ?? {}),
          shrink: true,
        },
        input: {
          ...(slotProps?.input ?? {}),
          notched: false,
        },
        htmlInput: {
          ...(slotProps?.htmlInput ?? {}),
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
            WebkitBoxShadow: `0 0 0 1000px ${tokens.colors.white} inset`,
            WebkitTextFillColor: tokens.colors.ink,
            WebkitTextDecorationColor: tokens.colors.ink,
            caretColor: tokens.colors.ink,
            transition: 'background-color 9999s ease-in-out 0s',
          },
        },
        '& .MuiInputLabel-root': staticLabelSx,
        '& .MuiInputBase-input': staticInputSx,
        ...(sx ?? {}),
      }}
    />
  );
}

export default StaticTextField;