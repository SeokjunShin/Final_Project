import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * 0~9 숫자를 랜덤하게 섞은 배열을 생성합니다.
 */
const shuffle = (): number[] => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

interface SecureKeypadProps {
    /** 현재 입력된 값 */
    value: string;
    /** 값 변경 핸들러 */
    onChange: (value: string) => void;
    /** 최대 길이 (기본 6) */
    maxLength?: number;
    /** 비활성 상태 */
    disabled?: boolean;
}

export const SecureKeypad = ({
    value,
    onChange,
    maxLength = 6,
    disabled = false,
}: SecureKeypadProps) => {
    const [keys, setKeys] = useState<number[]>(shuffle);

    // 키 배열 셔플
    const reshuffleKeys = useCallback(() => setKeys(shuffle()), []);

    // 마운트 시 셔플
    useEffect(() => {
        reshuffleKeys();
    }, [reshuffleKeys]);

    const handleKeyPress = (num: number) => {
        if (disabled || value.length >= maxLength) return;
        const next = value + String(num);
        onChange(next);
        // 입력할 때마다 키 배열을 다시 섞음 (보안 강화)
        reshuffleKeys();
    };

    const handleBackspace = () => {
        if (disabled || value.length === 0) return;
        onChange(value.slice(0, -1));
        reshuffleKeys();
    };

    const handleClear = () => {
        if (disabled) return;
        onChange('');
        reshuffleKeys();
    };

    // 3×4 그리드용 키 배치: 상단 9개 + 하단(전체삭제, 마지막 숫자, 지우기)
    const grid = useMemo(() => {
        const top = keys.slice(0, 9); // 9개
        const last = keys[9]; // 1개
        return { top, last };
    }, [keys]);

    // 마스킹된 표시
    const dots = Array.from({ length: maxLength }, (_, i) => (
        <Box
            key={i}
            sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: i < value.length ? '#d32f2f' : '#e0e0e0',
                transition: 'background 0.15s',
                mx: 0.5,
            }}
        />
    ));

    return (
        <Box
            sx={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
            }}
        >
            {/* 입력 표시 (마스킹) */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 2,
                    py: 1.5,
                    px: 2,
                    bgcolor: '#fafafa',
                    borderRadius: 1.5,
                    border: '1px solid #e0e0e0',
                }}
            >
                {dots}
                <Typography
                    variant="caption"
                    sx={{ ml: 1.5, color: '#999', fontSize: '0.72rem' }}
                >
                    {value.length}/{maxLength}
                </Typography>
            </Box>

            {/* 키패드 */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 0.8,
                }}
            >
                {grid.top.map((num, idx) => (
                    <Button
                        key={`${num}-${idx}`}
                        variant="outlined"
                        disabled={disabled || value.length >= maxLength}
                        onClick={() => handleKeyPress(num)}
                        sx={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            py: 1.3,
                            minWidth: 0,
                            borderColor: '#ddd',
                            color: '#333',
                            bgcolor: '#fff',
                            '&:hover': { bgcolor: '#f5f5f5', borderColor: '#bbb' },
                            '&:active': { bgcolor: '#eee' },
                        }}
                    >
                        {num}
                    </Button>
                ))}

                {/* 하단 행: 전체삭제 / 마지막 숫자 / 지우기 */}
                <Button
                    variant="outlined"
                    onClick={handleClear}
                    disabled={disabled || value.length === 0}
                    sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        py: 1.3,
                        minWidth: 0,
                        borderColor: '#ddd',
                        color: '#999',
                        bgcolor: '#f9f9f9',
                        '&:hover': { bgcolor: '#f0f0f0' },
                    }}
                >
                    전체삭제
                </Button>

                <Button
                    key={`last-${grid.last}`}
                    variant="outlined"
                    disabled={disabled || value.length >= maxLength}
                    onClick={() => handleKeyPress(grid.last)}
                    sx={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        py: 1.3,
                        minWidth: 0,
                        borderColor: '#ddd',
                        color: '#333',
                        bgcolor: '#fff',
                        '&:hover': { bgcolor: '#f5f5f5', borderColor: '#bbb' },
                        '&:active': { bgcolor: '#eee' },
                    }}
                >
                    {grid.last}
                </Button>

                <IconButton
                    onClick={handleBackspace}
                    disabled={disabled || value.length === 0}
                    sx={{
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        color: '#d32f2f',
                        bgcolor: '#f9f9f9',
                        '&:hover': { bgcolor: '#fff5f5' },
                    }}
                >
                    <BackspaceIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* 새로고침 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                    size="small"
                    startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                    onClick={reshuffleKeys}
                    disabled={disabled}
                    sx={{ fontSize: '0.72rem', color: '#999' }}
                >
                    키 배열 새로고침
                </Button>
            </Box>
        </Box>
    );
};
