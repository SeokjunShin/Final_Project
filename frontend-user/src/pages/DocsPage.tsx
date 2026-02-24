import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { docsApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';

export const DocsPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: async () => {
      try {
        return await docsApi.list();
      } catch {
        return [
          { id: 1, name: '신분증.pdf', status: 'REVIEWING', submittedAt: '2026-02-19' },
          { id: 2, name: '소득증빙.pdf', status: 'APPROVED', submittedAt: '2026-02-12' },
        ];
      }
    },
  });

  const upload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    await docsApi.upload(form).catch(() => null);
    setFile(null);
    refetch();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        문서함
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <Button component="label" variant="outlined">
              파일 선택
              <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            <Button variant="contained" disabled={!file} onClick={upload}>
              제출
            </Button>
            <Typography>{file?.name}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <TableSection
        rows={data ?? []}
        columns={[
          { field: 'name', headerName: '문서명', flex: 2 },
          { field: 'status', headerName: '상태', flex: 1 },
          { field: 'submittedAt', headerName: '제출일', flex: 1 },
        ]}
      />
    </Box>
  );
};
