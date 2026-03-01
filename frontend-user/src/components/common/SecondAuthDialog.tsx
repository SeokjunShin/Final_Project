import { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Typography } from '@mui/material';
import { SecureKeypad } from '@/components/common/SecureKeypad';
import { authApi } from '@/api';

interface Props {
    open: boolean;
    onSuccess: () => void;
    onClose: () => void;
}

export const SecondAuthDialog = ({ open, onSuccess, onClose }: Props) => {
    const [secondPwd, setSecondPwd] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setSecondPwd('');
            setError('');
        }
    }, [open]);

    useEffect(() => {
        if (secondPwd.length === 6) {
            authApi.verifySecondPassword(secondPwd)
                .then(() => {
                    sessionStorage.setItem('second_auth_passed', 'true');
                    setSecondPwd('');
                    onSuccess();
                })
                .catch((err) => {
                    setError(err.response?.data?.message || '비밀번호가 일치하지 않습니다.');
                    setSecondPwd('');
                });
        }
    }, [secondPwd, onSuccess]);

    return (
        <Dialog open={open} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { } }}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' } } }}
        >
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#333', pt: 3, pb: 1 }}>
                2차 비밀번호 인증
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4, overflow: 'hidden' }}>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
                    안전한 서비스 이용을 위해<br />
                    2차 비밀번호(6자리)를 입력해 주세요.
                </Typography>
                <Box sx={{ width: '100%', maxWidth: 300 }}>
                    <SecureKeypad value={secondPwd} onChange={(v) => { setSecondPwd(v); setError(''); }} />
                    {error && <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600 }}>{error}</Typography>}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2, px: 3, color: '#666', borderColor: '#ccc' }}>
                            닫기
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};
