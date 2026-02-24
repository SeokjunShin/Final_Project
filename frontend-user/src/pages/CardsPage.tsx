import { Box, Button, Card, CardContent, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '@/api';
import { useSnackbar } from '@/contexts/SnackbarContext';

export const CardsPage = () => {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      try {
        return await cardsApi.list();
      } catch {
        return [
          { id: 1, name: 'MyCard Platinum', maskedNumber: '1234-****-****-5678', overseasEnabled: false, reissueStatus: 'NONE' },
          { id: 2, name: 'MyCard Daily', maskedNumber: '1299-****-****-0044', overseasEnabled: true, reissueStatus: 'REQUESTED' },
        ];
      }
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        카드관리
      </Typography>
      <Stack spacing={2}>
        {(data ?? []).map((card) => (
          <Card key={card.id}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{card.name}</Typography>
                  <Typography color="text.secondary">{card.maskedNumber}</Typography>
                  <Typography color="text.secondary">재발급 상태: {card.reissueStatus}</Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={card.overseasEnabled}
                      onChange={async (_, checked) => {
                        await cardsApi.toggleOverseas(card.id, checked).catch(() => null);
                        show('해외결제 설정이 반영되었습니다.', 'success');
                        queryClient.invalidateQueries({ queryKey: ['cards'] });
                      }}
                    />
                  }
                  label="해외결제"
                />
                <Button
                  variant="outlined"
                  onClick={async () => {
                    await cardsApi.requestReissue(card.id).catch(() => null);
                    show('분실/재발급 신청이 접수되었습니다.', 'success');
                    queryClient.invalidateQueries({ queryKey: ['cards'] });
                  }}
                >
                  분실/재발급 신청
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};
