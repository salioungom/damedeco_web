import { Box, Tooltip, Typography } from '@mui/material';

interface PaymentIconsProps {
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function PaymentIcons({ size = 'md', showLabels = false }: PaymentIconsProps) {
  const plaque = size === 'sm' ? { w: 56, h: 40 } : size === 'md' ? { w: 72, h: 52 } : { w: 96, h: 64 };

  const paymentMethods = [
    {
      name: 'Wave',
      logo: '/payment/wave.png',
      color: '#00D4AA',
      textColor: 'primary.main',
    },
    {
      name: 'Orange Money',
      logo: '/payment/om.jpg',
      color: '#FF7900',
      textColor: 'warning.main',
    },
    {
      name: 'Carte bancaire',
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIyIiB5PSI1IiB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHJ4PSIyIiBzdHJva2U9IiMwYjRmOWUiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0yIDEwSDIyIiBzdHJva2U9IiMwYjRmOWUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
      color: '#0b4f9e',
      textColor: 'primary.main',
    },
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      {paymentMethods.map((method) => (
        <Tooltip title={method.name} key={method.name}>
          <Box
            sx={{
              width: plaque.w,
              height: plaque.h,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.5,
              '& img': {
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                imageRendering: 'auto',
              },
            }}
          >
            <img
              src={method.logo}
              alt={method.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                imageRendering: 'auto',
              }}
            />
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}
