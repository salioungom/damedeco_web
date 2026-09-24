'use client';

import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Typography,
} from '@mui/material';
import StaticTextField from './StaticTextField';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';

const MESSAGE_MAX = 1000;

const SUBJECTS = ['Question générale', 'Commande', 'Achat en gros', 'Autre'] as const;

type FieldName = 'name' | 'email' | 'phone' | 'subject' | 'message';

const INITIAL = { name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' };

const LABELS: Record<FieldName, string> = {
  name: 'Nom complet',
  email: 'E-mail',
  phone: 'Téléphone (facultatif)',
  subject: 'Sujet',
  message: 'Votre message',
};

function validate(field: FieldName, value: string): string {
  const text = value.trim();
  if (field === 'name') {
    if (!text) return 'Veuillez indiquer votre nom.';
    if (text.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
  }
  if (field === 'email') {
    if (!text) return 'Veuillez indiquer votre e-mail.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) return 'Veuillez saisir un e-mail valide.';
  }
  if (field === 'phone') {
    if (text && !/^\+?[\d\s().-]{8,}$/.test(text)) return 'Veuillez saisir un numéro valide.';
  }
  if (field === 'subject') {
    if (!text) return 'Veuillez choisir un sujet.';
  }
  if (field === 'message') {
    if (!text) return 'Veuillez écrire votre message.';
    if (text.length < 10) return 'Votre message doit contenir au moins 10 caractères.';
  }
  return '';
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function ContactForm() {
  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [serverError, setServerError] = useState(false);

  const setValue = (field: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  const onBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, values[field]) }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const honeypot = (form.elements.namedItem('company') as HTMLInputElement | null)?.value;
    if (honeypot) {
      setStatus('success');
      return;
    }

    const nextErrors: Partial<Record<FieldName, string>> = {};
    (Object.keys(LABELS) as FieldName[]).forEach((field) => {
      nextErrors[field] = validate(field, values[field]);
    });
    setErrors(nextErrors);
    setTouched({ name: true, email: true, phone: true, subject: true, message: true });

    if (Object.values(nextErrors).some((error) => error)) return;

    setServerError(false);
    setStatus('sending');
    try {
      await wait(1500);
      setStatus('success');
    } catch {
      setStatus('idle');
      setServerError(true);
    }
  };

  const handleReset = () => {
    setValues(INITIAL);
    setTouched({});
    setErrors({});
    setServerError(false);
    setStatus('idle');
  };

  const focusRing = {
    '&:focus-visible': {
      outline: `2px solid ${tokens.colors.status.focus}`,
      outlineOffset: '2px',
    },
  };

  if (status === 'success') {
    return (
      <Box role="status" aria-live="polite" sx={{ bgcolor: 'background.paper', border: `1px solid ${tokens.colors.border.light}`, borderRadius: 2, p: { xs: 3, sm: 5 } }}>
        <Typography
          component="h3"
          sx={{ fontFamily: FONT_FRAUNCES, fontSize: 28, fontWeight: 600, color: 'text.primary', mb: 1.5 }}
        >
          Message envoyé.
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: '55ch' }}>
          Merci pour votre message. Nous revenons vers vous sous 24 h, y compris le week-end.
        </Typography>
        <Button variant="outlined" size="large" onClick={handleReset} sx={{ height: 48 }}>
          Envoyer un autre message
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ bgcolor: 'background.paper', border: `1px solid ${tokens.colors.border.light}`, borderRadius: 2, p: { xs: 3, sm: 5 } }}
    >
      <Typography
        component="h2"
        id="contact-form"
        sx={{ fontFamily: FONT_FRAUNCES, fontSize: 28, fontWeight: 600, color: 'text.primary', mb: 1 }}
      >
        Envoyez-nous un message
      </Typography>
      <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: 'text.secondary', mb: 4 }}>
        Réponse sous 24 h, devis chiffré et personnalisé sur demande.
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ borderRadius: 1, mb: 3 }}>
          Une erreur est survenue pendant l’envoi. Veuillez réessayer.
        </Alert>
      )}

      <Box
        aria-hidden="true"
        sx={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
      >
        <StaticTextField
          name="company"
          label="Société"
          autoComplete="off"
          tabIndex={-1}
          onChange={() => undefined}
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 3 }}>
        <StaticTextField
          label={LABELS.name}
          name="name"
          autoComplete="name"
          value={values.name}
          error={Boolean(touched.name && errors.name)}
          helperText={touched.name && errors.name ? errors.name : undefined}
          onBlur={() => onBlur('name')}
          onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue('name', event.target.value)}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <StaticTextField
            label={LABELS.email}
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            error={Boolean(touched.email && errors.email)}
            helperText={touched.email && errors.email ? errors.email : undefined}
            onBlur={() => onBlur('email')}
            onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue('email', event.target.value)}
          />
          <StaticTextField
            label={LABELS.phone}
            type="tel"
            name="phone"
            autoComplete="tel"
            value={values.phone}
            error={Boolean(touched.phone && errors.phone)}
            helperText={touched.phone && errors.phone ? errors.phone : undefined}
            onBlur={() => onBlur('phone')}
            onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue('phone', event.target.value)}
          />
        </Box>

        <StaticTextField
          select
          label={LABELS.subject}
          name="subject"
          value={values.subject}
          error={Boolean(touched.subject && errors.subject)}
          helperText={touched.subject && errors.subject ? errors.subject : undefined}
          onBlur={() => onBlur('subject')}
          onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue('subject', event.target.value)}
        >
          {SUBJECTS.map((subject) => (
            <MenuItem key={subject} value={subject}>
              {subject}
            </MenuItem>
          ))}
        </StaticTextField>

        <Box>
          <StaticTextField
            label={LABELS.message}
            multiline
            minRows={5}
            maxLength={MESSAGE_MAX}
            name="message"
            value={values.message}
            error={Boolean(touched.message && errors.message)}
            helperText={touched.message && errors.message ? errors.message : undefined}
            onBlur={() => onBlur('message')}
            onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue('message', event.target.value)}
            slotProps={{
              htmlInput: {
                sx: {
                  height: 'auto',
                  padding: '14px',
                  lineHeight: 1.6,
                  minHeight: 44,
                },
              },
            }}
          />
          <Typography
            sx={{
              mt: 1,
              fontSize: 12,
              color: 'text.secondary',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {values.message.length}/{MESSAGE_MAX}
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={status === 'sending'}
          aria-busy={status === 'sending'}
          sx={{ height: 48, mt: 1, ...focusRing }}
        >
          {status === 'sending' ? (
            <CircularProgress size={20} thickness={4} color="inherit" />
          ) : (
            'Envoyer le message'
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default ContactForm;