import { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { authApi } from '@/api';
import { SecureKeypad } from '@/components/common/SecureKeypad';

interface Props {
    open: boolean;
    onClose: () => void;
}

export const ResetSecondPasswordModal = ({ open, onClose }: Props) => {
    const { show } = useSnackbar();

    // 1: 이메일 입력, 2: 인증코드 입력, 3: 새비밀번호 1, 4: 새비밀번호 2(확인)
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // 모달이 열릴 때 상태 초기화
    useEffect(() => {
        if (open) {
            setStep(1);
            setEmail('');
            setCode('');
            setNewPassword('');
            setConfirmPassword('');
            setErrorMsg('');
            setIsLoading(false);
        }
    }, [open]);

    // Step 2, 3, 4에서 키패드 입력이 6자리 완료되었을 때 자동 진행
    useEffect(() => {
        if (step === 2 && code.length === 6) {
            // 인증코드 확인 없이 바로 다음 화면으로 넘김 (완전 제출 시 검증됨)
            setStep(3);
        } else if (step === 3 && newPassword.length === 6) {
            setStep(4);
        } else if (step === 4 && confirmPassword.length === 6) {
            handleFinalSubmit();
        }
    }, [code, newPassword, confirmPassword, step]);

    const handleSendEmail = async () => {
        if (!email || !email.includes('@')) {
            setErrorMsg('유효한 이메일 주소를 입력해 주세요.');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');
        try {
            await authApi.sendResetCode(email);
            show('인증 메일이 발송되었습니다. (로컬 터미널 확인)', 'success');
            setStep(2);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || '발송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (newPassword !== confirmPassword) {
            setErrorMsg('비밀번호가 일치하지 않습니다. 처음부터 다시 설정해주세요.');
            setNewPassword('');
            setConfirmPassword('');
            setStep(3);
            return;
        }

        setIsLoading(true);
        setErrorMsg('');
        try {
            await authApi.resetSecondPassword({
                email,
                code,
                newSecondPassword: newPassword,
            });
            show('2차 비밀번호가 성공적으로 재설정되었습니다.', 'success');
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || '인증 코드 검증에 실패했습니다.';
            setErrorMsg(msg);
            // 코드가 틀린 경우 2단계로 롤백
            if (msg.includes('인증 코드')) {
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
                setStep(2);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (step) {
            case 1: return '이메일 확인';
            case 2: return '인증 번호 입력';
            case 3: return '새 비밀번호 설정';
            case 4: return '새 비밀번호 확인';
            default: return '';
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } }}
            slotProps={{
                backdrop: {
                    sx: { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' }
                }
            }}
            onClose={(_, reason) => {
                if (reason !== 'backdropClick') onClose();
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#333', pt: 3, pb: 1 }}>
                {getTitle()}
            </DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4, overflow: 'hidden' }}>
                <Box sx={{ width: '100%', maxWidth: 300 }}>
                    {step === 1 && (
                        <>
                            <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
                                본인 확인 코드를 받으실<br />
                                이메일 주소를 입력해 주세요.
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                label="이메일 주소"
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                                placeholder="example@gmail.com"
                                sx={{ mb: 2 }}
                                error={!!errorMsg}
                            />
                            {errorMsg && (
                                <Typography color="error" variant="caption" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
                                    {errorMsg}
                                </Typography>
                            )}
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" color="inherit" onClick={onClose} fullWidth sx={{ borderRadius: 2 }}>
                                    취소
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSendEmail}
                                    fullWidth
                                    disabled={isLoading}
                                    sx={{ borderRadius: 2, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                                >
                                    {isLoading ? '발송 중...' : '인증코드 받기'}
                                </Button>
                            </Stack>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
                                {email}로 발송된<br />
                                인증코드 6자리를 입력해 주세요.
                            </Typography>
                            <SecureKeypad value={code} onChange={(v) => { setCode(v); setErrorMsg(''); }} />
                            {errorMsg && (
                                <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600 }}>
                                    {errorMsg}
                                </Typography>
                            )}
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2, px: 3, color: '#666', borderColor: '#ccc' }}>
                                    닫기
                                </Button>
                            </Box>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
                                사용하실 새로운 2차 비밀번호<br />
                                6자리를 입력해 주세요.
                            </Typography>
                            <SecureKeypad value={newPassword} onChange={(v) => setNewPassword(v)} />
                            {errorMsg && (
                                <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600 }}>
                                    {errorMsg}
                                </Typography>
                            )}
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2, px: 3, color: '#666', borderColor: '#ccc' }}>
                                    취소
                                </Button>
                            </Box>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
                                확인을 위해 설정하신 비밀번호를<br />
                                다시 한 번 입력해 주세요.
                            </Typography>
                            <SecureKeypad value={confirmPassword} onChange={(v) => setConfirmPassword(v)} />
                            {isLoading && (
                                <Typography color="primary" variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600 }}>
                                    변경 중입니다...
                                </Typography>
                            )}
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button variant="outlined" color="inherit" disabled={isLoading} onClick={onClose} sx={{ borderRadius: 2, px: 3, color: '#666', borderColor: '#ccc' }}>
                                    취소
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};
