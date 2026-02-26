import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type ReissueRequestItem } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const ReissueRequestsPage = () => {
  const queryClient = useQueryClient();
  const { show } = useAdminSnackbar();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['admin-reissue-requests'],
    queryFn: () => adminApi.reissueRequests(),
  });

  const completeMutation = useMutation({
    mutationFn: (cardId: number) => adminApi.completeReissue(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reissue-requests'] });
      show('재발급 완료 처리되었습니다.', 'success');
    },
    onError: () => {
      show('처리 중 오류가 발생했습니다.', 'error');
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        재발급 신청
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        회원이 요청한 카드 재발급 신청 목록입니다. 재발급 완료 후 [재발급 완료] 버튼을 눌러 상태를 반영하세요.
      </Typography>
      {!isLoading && list.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          재발급 신청 건이 없습니다. 회원이 카드관리 화면에서 [재발급] 버튼을 누르면 여기에 표시됩니다.
        </Typography>
      )}

      <Card>
        <CardContent>
          <AdminTable
            loading={isLoading}
            rows={list}
            getRowId={(row: ReissueRequestItem) => String(row.cardId)}
            columns={[
              { field: 'cardId', headerName: '카드 ID', width: 90 },
              { field: 'cardNumberMasked', headerName: '카드번호', flex: 1, valueGetter: (_: unknown, row: ReissueRequestItem) => row.cardNumberMasked ?? '-' },
              { field: 'cardAlias', headerName: '카드명', flex: 1, valueGetter: (_: unknown, row: ReissueRequestItem) => row.cardAlias ?? '-' },
              { field: 'userName', headerName: '회원명', flex: 1, valueGetter: (_: unknown, row: ReissueRequestItem) => row.userName ?? '-' },
              { field: 'userEmail', headerName: '이메일', flex: 1, valueGetter: (_: unknown, row: ReissueRequestItem) => row.userEmail ?? '-' },
              { field: 'requestedAt', headerName: '신청일시', flex: 1, valueGetter: (_: unknown, row: ReissueRequestItem) => formatDate(row.requestedAt) },
              {
                field: 'action',
                headerName: '처리',
                width: 120,
                sortable: false,
                filterable: false,
                renderCell: (params: { row: ReissueRequestItem }) => (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={completeMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      completeMutation.mutate(params.row.cardId);
                    }}
                  >
                    재발급 완료
                  </Button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
