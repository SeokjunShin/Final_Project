import { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Typography } from '@mui/material';
import { SecureKeypad } from './SecureKeypad';

interface Props {
    open: boolean;
    onComplete: (pin: string) => void;
    onClose: () => void;
    title?: string;
}

export const SecondAuthDialog = ({ open, onComplete, onClose, title = '2차 비밀번호 인증' }: Props) => {
    const [secondPwd, setSecondPwd] = useState('');

    useEffect(() => {
        if (open) {
            setSecondPwd('');
        }
    }, [open]);

    useEffect(() => {
        if (secondPwd.length === 6) {
            const pass = secondPwd;
            setSecondPwd('');
            onComplete(pass);
        }
    }, [secondPwd, onComplete]);

    return (
        <Dialog open={open} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { } }}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' } } }}
        >
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#333', pt: 3, pb: 1 }}>
                {title}
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4, overflow: 'hidden' }}>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
                    관리자 권한 확인을 위해<br />
                    2차 비밀번호(6자리)를 마우스로 입력해 주세요.
                </Typography>
                <Box sx={{ width: '100%', maxWidth: 300 }}>
                    <SecureKeypad value={secondPwd} onChange={(v) => { setSecondPwd(v); }} />
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2, px: 3, color: '#666', borderColor: '#ccc' }}>
                            취소
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};
