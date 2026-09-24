'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { staticLabelSx, staticInputSx } from '@/components/ui/StaticTextField';

const HIDE_AFTER_INACTIVITY_MS = 30_000;

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'type'>;

export const PasswordField = forwardRef<HTMLDivElement, PasswordFieldProps>(
  function PasswordField({ slotProps, sx, onChange, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setRootRef = (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        ref.current = node;
      }
    };

    const hidePassword = useCallback(() => setVisible(false), []);

    const resetIdleTimer = useCallback(() => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(hidePassword, HIDE_AFTER_INACTIVITY_MS);
    }, [hidePassword]);

    useEffect(() => {
      if (!visible) return;
      resetIdleTimer();
      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
    }, [visible, resetIdleTimer]);

    useEffect(() => {
      const hideOnTabHidden = () => {
        if (document.hidden) setVisible(false);
      };
      document.addEventListener('visibilitychange', hideOnTabHidden);
      return () => document.removeEventListener('visibilitychange', hideOnTabHidden);
    }, []);

    useEffect(() => {
      const form = rootRef.current?.closest('form') ?? null;
      if (!form) return;
      form.addEventListener('submit', hidePassword);
      form.addEventListener('reset', hidePassword);
      return () => {
        form.removeEventListener('submit', hidePassword);
        form.removeEventListener('reset', hidePassword);
      };
    }, [hidePassword]);

    const label = visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe';

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (visible) resetIdleTimer();
      onChange?.(event);
    };

    return (
      <TextField
        {...rest}
        ref={setRootRef}
        type={visible ? 'text' : 'password'}
        onChange={handleChange}
        slotProps={{
          ...slotProps,
          inputLabel: {
            ...(slotProps?.inputLabel ?? {}),
            shrink: true,
            sx: {
              ...staticLabelSx,
              ...(slotProps?.inputLabel?.sx ?? {}),
            },
          },
          htmlInput: {
            ...(slotProps?.htmlInput ?? {}),
            autoCapitalize: 'off',
            autoCorrect: 'off',
            spellCheck: false,
            sx: {
              ...staticInputSx,
              ...(slotProps?.htmlInput?.sx ?? {}),
            },
          },
          input: {
            ...(slotProps?.input ?? {}),
            notched: false,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  size="medium"
                  edge="end"
                  aria-label={label}
                  aria-pressed={visible}
                  title={label}
                  disabled={rest.disabled}
                  onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                  onClick={() => setVisible((previous) => !previous)}
                  sx={{
                    width: 40,
                    height: 40,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'rgba(24, 95, 165, 0.08)',
                    },
                    '@media (pointer: coarse)': {
                      width: 44,
                      height: 44,
                    },
                  }}
                >
                  {visible ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          '& input::-ms-reveal': { display: 'none' },
          ...(sx ?? {}),
        }}
      />
    );
  },
);

export default PasswordField;