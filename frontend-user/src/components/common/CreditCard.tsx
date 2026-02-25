import { Box, Typography } from '@mui/material';

interface CreditCardProps {
  cardName: string;
  cardNumber?: string;
  cardType?: 'platinum' | 'gold' | 'check' | 'classic' | 'blue' | 'default';
  size?: 'small' | 'medium' | 'large';
}

const CARD_THEMES = {
  platinum: {
    background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 50%, #3d3d3d 100%)',
    textColor: '#fff',
    accentColor: '#c0c0c0',
    chipColor: '#d4af37',
  },
  gold: {
    background: 'linear-gradient(135deg, #d4af37 0%, #b8960c 50%, #e6c84b 100%)',
    textColor: '#1a1a1a',
    accentColor: '#8b7500',
    chipColor: '#fff',
  },
  check: {
    background: 'linear-gradient(135deg, #7dd3c0 0%, #5bbfaa 50%, #9de5d5 100%)',
    textColor: '#1a1a1a',
    accentColor: '#2d8a7a',
    chipColor: '#fff',
  },
  classic: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0d2137 50%, #2a4a73 100%)',
    textColor: '#fff',
    accentColor: '#6b9ac4',
    chipColor: '#d4af37',
  },
  blue: {
    background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 50%, #2196f3 100%)',
    textColor: '#fff',
    accentColor: '#90caf9',
    chipColor: '#fff',
  },
  default: {
    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 50%, #ef5350 100%)',
    textColor: '#fff',
    accentColor: '#ffcdd2',
    chipColor: '#fff',
  },
};

const CARD_SIZES = {
  small: { width: 180, height: 113, fontSize: 0.65 },
  medium: { width: 280, height: 176, fontSize: 1 },
  large: { width: 340, height: 214, fontSize: 1.2 },
};

const getCardType = (cardName: string): keyof typeof CARD_THEMES => {
  if (!cardName) return 'default';
  const name = cardName.toLowerCase();
  if (name.includes('platinum') || name.includes('플래티넘')) return 'platinum';
  if (name.includes('gold') || name.includes('골드')) return 'gold';
  if (name.includes('check') || name.includes('체크')) return 'check';
  if (name.includes('classic') || name.includes('클래식')) return 'classic';
  if (name.includes('blue') || name.includes('블루')) return 'blue';
  return 'default';
};

export const CreditCard = ({ cardName, cardNumber, cardType, size = 'medium' }: CreditCardProps) => {
  const type = cardType || getCardType(cardName);
  const theme = CARD_THEMES[type];
  const sizeConfig = CARD_SIZES[size];

  return (
    <Box
      sx={{
        width: sizeConfig.width,
        height: sizeConfig.height,
        background: theme.background,
        borderRadius: 2,
        p: 2 * sizeConfig.fontSize,
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '50%',
        },
      }}
    >
      {/* Card Brand */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <Typography
          sx={{
            color: theme.textColor,
            fontWeight: 800,
            fontSize: 14 * sizeConfig.fontSize,
            letterSpacing: 1,
          }}
        >
          MyCard
        </Typography>
        {/* Contactless Icon */}
        <Box sx={{ opacity: 0.7 }}>
          <svg width={20 * sizeConfig.fontSize} height={20 * sizeConfig.fontSize} viewBox="0 0 24 24" fill={theme.textColor}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </Box>
      </Box>

      {/* EMV Chip */}
      <Box
        sx={{
          width: 40 * sizeConfig.fontSize,
          height: 30 * sizeConfig.fontSize,
          background: `linear-gradient(135deg, ${theme.chipColor} 0%, ${theme.chipColor}90 100%)`,
          borderRadius: 1,
          position: 'relative',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: 4,
            right: 4,
            height: 1,
            background: 'rgba(0,0,0,0.2)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: '50%',
            width: 1,
            background: 'rgba(0,0,0,0.2)',
          },
        }}
      />

      {/* Card Number */}
      <Typography
        sx={{
          color: theme.textColor,
          fontFamily: '"Courier New", monospace',
          fontSize: 14 * sizeConfig.fontSize,
          letterSpacing: 2,
          zIndex: 1,
        }}
      >
        {cardNumber || '•••• •••• •••• ••••'}
      </Typography>

      {/* Card Name & Type */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
        <Typography
          sx={{
            color: theme.accentColor,
            fontSize: 10 * sizeConfig.fontSize,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {cardName || 'CARD HOLDER'}
        </Typography>
        {/* Card Network Logo */}
        <Box sx={{ display: 'flex', gap: 0.3 }}>
          <Box sx={{ width: 20 * sizeConfig.fontSize, height: 20 * sizeConfig.fontSize, borderRadius: '50%', bgcolor: '#eb001b', opacity: 0.9 }} />
          <Box sx={{ width: 20 * sizeConfig.fontSize, height: 20 * sizeConfig.fontSize, borderRadius: '50%', bgcolor: '#f79e1b', opacity: 0.9, ml: -1.2 * sizeConfig.fontSize }} />
        </Box>
      </Box>
    </Box>
  );
};
