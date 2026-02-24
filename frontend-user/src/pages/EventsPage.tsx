import { Box, Card, CardContent, Typography } from '@mui/material';
import { TableSection } from '@/components/common/TableSection';

const rows = [
  { id: 1, title: '봄맞이 캐시백 이벤트', period: '2026-03-01 ~ 2026-04-30', status: 'ACTIVE' },
];

export const EventsPage = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        이벤트
      </Typography>
      <Card>
        <CardContent>
          <TableSection
            rows={rows}
            columns={[
              { field: 'title', headerName: '제목', flex: 2 },
              { field: 'period', headerName: '기간', flex: 2 },
              { field: 'status', headerName: '상태', flex: 1 },
            ]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
