import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from '@/contexts/SnackbarContext';

export const CardApplicationsPage = () => {
  const { show } = useSnackbar();
  const [cardType, setCardType] = useState('PLATINUM');
  const [purpose, setPurpose] = useState('');

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        카드 신청 / 발급
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField select label="카드 종류" value={cardType} onChange={(e) => setCardType(e.target.value)}>
              <MenuItem value="PLATINUM">MyCard Platinum</MenuItem>
              <MenuItem value="GOLD">MyCard Gold</MenuItem>
              <MenuItem value="CHECK">MyCard Check</MenuItem>
            </TextField>
            <TextField label="신청 사유" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <Button
              variant="contained"
              onClick={() => show('신규 카드 신청이 접수되었습니다. (모의)', 'success')}
            >
              신청
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
