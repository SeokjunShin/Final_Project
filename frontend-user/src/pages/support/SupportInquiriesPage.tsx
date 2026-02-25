import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
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
    queryFn: () => supportApi.list({ page: 0, size: 20 }),
  });

  const detailQuery = useQuery({
    queryKey: ['support-inquiry', selectedId],
    enabled: !!selectedId,
    queryFn: () => supportApi.detail(Number(selectedId!)),
    retry: false,
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
              initialState={{ sorting: { sortModel: [{ field: 'id', sort: 'desc' }] } }}
              onRowClick={(params) => setSelectedId(Number(params.id))}
            />
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1.4 }}>문의 상세</Typography>
            {detailQuery.isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {detailQuery.isError && (
              <Typography variant="body2" color="error">
                문의 정보를 불러올 수 없습니다.
              </Typography>
            )}
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
            ) : !detailQuery.isLoading && !detailQuery.isError ? (
              <Typography variant="body2" color="text.secondary">왼쪽 목록에서 문의를 선택하세요.</Typography>
            ) : null}
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>문의 등록</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <FormControl fullWidth error={!!form.formState.errors.category}>
              <InputLabel id="category-label">분류</InputLabel>
              <Select
                labelId="category-label"
                label="분류"
                defaultValue=""
                {...form.register('category')}
              >
                <MenuItem value="GENERAL">일반</MenuItem>
                <MenuItem value="CARD">카드</MenuItem>
                <MenuItem value="BILLING">청구/결제</MenuItem>
                <MenuItem value="POINT">포인트</MenuItem>
                <MenuItem value="ACCOUNT">계정</MenuItem>
                <MenuItem value="OTHER">기타</MenuItem>
              </Select>
              {form.formState.errors.category && (
                <FormHelperText>{form.formState.errors.category.message}</FormHelperText>
              )}
            </FormControl>
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
