'use client';

import { useEffect, useRef } from 'react';
import { Box, TextField } from '@mui/material';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OTPInput({ value, onChange, length = 6, disabled = false }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }

    const newOTP = value.split('');
    newOTP[index] = val;
    const otpString = newOTP.join('');

    onChange(otpString);

    // Auto-focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData.padEnd(length, ''));
      // Focus last filled input
      const lastIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
      {Array.from({ length }, (_, index) => (
        <TextField
          key={index}
          inputRef={(el: HTMLInputElement | null) => (inputRefs.current[index] = el)}
          value={value[index] || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          variant="outlined"
          slotProps={{
            htmlInput: {
              maxLength: 1,
              sx: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontFamily: 'monospace',
                width: '3rem',
                height: '3rem',
                p: 0,
              },
            },
          }}
          disabled={disabled}
        />
      ))}
    </Box>
  );
}
