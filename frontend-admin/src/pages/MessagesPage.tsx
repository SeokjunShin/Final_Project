import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  userId: z.string().min(1, '수신 사용자를 입력하세요.'),
  content: z.string().min(2, '메시지를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

interface Message {
  id: number;
  userId: string;
  content: string;
  sentAt: string;
}

export const MessagesPage = () => {
  const { show } = useAdminSnackbar();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data, isLoading, error } = useQuery<Message[]>({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      return await adminApi.messages();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    try {
      await adminApi.sendMessage(value);
      show('메시지가 발송되었습니다.', 'success');
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    } catch {
      show('메시지 발송에 실패했습니다.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        메시지 발송
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="사용자 ID" {...register('userId')} error={!!errors.userId} helperText={errors.userId?.message} />
            <TextField label="메시지" sx={{ minWidth: 320 }} {...register('content')} error={!!errors.content} helperText={errors.content?.message} />
            <Button variant="contained" type="submit" disabled={isSubmitting}>
              발송
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">메시지 데이터를 불러올 수 없습니다.</Typography>
        </Box>
      ) : (!data || data.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">발송된 메시지가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data}
          columns={[
            { field: 'userId', headerName: '사용자', flex: 1 },
            { 
              field: 'content', 
              headerName: '메시지', 
              flex: 2,
              renderCell: (params) => (
                <Typography 
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setSelectedMessage(params.row)}
                >
                  {params.row.content}
                </Typography>
              )
            },
            { field: 'sentAt', headerName: '발송일시', flex: 1 },
            {
              field: 'action',
              headerName: '상세',
              width: 100,
              renderCell: (params) => (
                <Button size="small" onClick={() => setSelectedMessage(params.row)}>
                  보기
                </Button>
              ),
            },
          ]}
        />
      )}

      <Dialog open={!!selectedMessage} onClose={() => setSelectedMessage(null)} fullWidth maxWidth="sm">
        <DialogTitle>메시지 상세</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                수신자 ID: {selectedMessage.userId}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                발송일시: {selectedMessage.sentAt}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                {selectedMessage.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMessage(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
