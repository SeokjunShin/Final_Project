import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supportApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';

const createSchema = z.object({
  category: z.string().min(1, '분류를 입력하세요.'),
  title: z.string().min(1, '제목을 입력하세요.'),
  content: z.string().min(5, '내용을 5자 이상 입력하세요.'),
});

type CreateForm = z.infer<typeof createSchema>;

export const SupportInquiriesPage = () => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { show } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['support-inquiries'],
    queryFn: async () => {
      try {
        return await supportApi.list({ page: 0, size: 20 });
      } catch {
        return {
          content: [
            { id: 90001, category: 'BILLING', title: '명세서 금액이 이상해요', status: 'ANSWERED', createdAt: '2026-03-02' },
            { id: 90002, category: 'CARD', title: '해외결제 차단 설정 문의', status: 'OPEN', createdAt: '2026-03-07' },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 20,
        };
      }
    },
  });

  const detailQuery = useQuery({
    queryKey: ['support-inquiry', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      try {
        return await supportApi.detail(Number(selectedId));
      } catch {
        return {
          id: selectedId,
          category: 'BILLING',
          title: '명세서 금액이 이상해요',
          content: '2월 명세서에 포함된 내역 확인 부탁드립니다.',
          status: 'ANSWERED',
          createdAt: '2026-03-02',
          replies: [
            {
              id: 1,
              content: '취소건 반영 대기 상태입니다. 1~2영업일 내 자동 반영됩니다.',
              authorName: '박상담',
              isStaffReply: true,
              createdAt: '2026-03-02 11:10:00',
            },
          ],
        };
      }
    },
  });

  const form = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (payload: CreateForm) => supportApi.create(payload),
    onSuccess: () => {
      show('문의가 등록되었습니다.', 'success');
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['support-inquiries'] });
    },
    onError: () => show('문의 등록에 실패했습니다.', 'error'),
  });

  const statusChip = (status: string) => {
    if (status === 'ANSWERED') return <Chip size="small" color="primary" label="답변완료" />;
    if (status === 'ASSIGNED') return <Chip size="small" color="warning" label="처리중" />;
    if (status === 'CLOSED') return <Chip size="small" color="default" label="종료" />;
    return <Chip size="small" label="접수" />;
  };

  const columns = useMemo(
    () => [
      { field: 'id', headerName: '번호', width: 100 },
      { field: 'category', headerName: '분류', width: 120 },
      { field: 'title', headerName: '제목', flex: 1.6 },
      {
        field: 'status',
        headerName: '상태',
        width: 140,
        renderCell: (params: any) => statusChip(params.row.status),
      },
      { field: 'createdAt', headerName: '등록일', width: 140 },
    ],
    [],
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">고객센터 문의</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
          문의 등록
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2} alignItems="stretch">
        <Card sx={{ flex: 1.2 }}>
          <CardContent>
            <TableSection
              loading={isLoading}
              rows={data?.content ?? []}
              columns={columns as any}
              onRowClick={(params) => setSelectedId(Number(params.id))}
            />
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1.4 }}>문의 상세</Typography>
            {detailQuery.data ? (
              <Stack spacing={1.3}>
                <Typography variant="body2" color="text.secondary">[{detailQuery.data.category}]</Typography>
                <Typography sx={{ fontWeight: 700 }}>{detailQuery.data.title}</Typography>
                <Typography variant="body2">{detailQuery.data.content}</Typography>
                <Box>{statusChip(detailQuery.data.status)}</Box>
                <Typography variant="caption" color="text.secondary">등록일: {detailQuery.data.createdAt}</Typography>

                <Typography sx={{ fontWeight: 700, mt: 1 }}>답변</Typography>
                {(detailQuery.data.replies ?? []).map((reply) => (
                  <Box key={reply.id} sx={{ p: 1.2, border: '1px solid #e1e9f8', borderRadius: 2 }}>
                    <Typography variant="body2">{reply.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reply.authorName} · {reply.createdAt}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">왼쪽 목록에서 문의를 선택하세요.</Typography>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>문의 등록</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <TextField label="분류(CARD/BILLING/POINT)" {...form.register('category')} error={!!form.formState.errors.category} helperText={form.formState.errors.category?.message} />
            <TextField label="제목" {...form.register('title')} error={!!form.formState.errors.title} helperText={form.formState.errors.title?.message} />
            <TextField label="내용" multiline minRows={5} {...form.register('content')} error={!!form.formState.errors.content} helperText={form.formState.errors.content?.message} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={form.handleSubmit((v) => createMutation.mutate(v))}>
            등록
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
