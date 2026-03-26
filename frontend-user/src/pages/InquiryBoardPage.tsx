import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Box, Button, Container, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';
import { ChatBot } from '@/components/common/ChatBot';
import { sanitizeBoardInput, toSafePlainText } from '@/utils/safeHtml';

interface Board {
    id: number;
    title: string;
    content: string;
    authorName: string;
    category?: string;
    allowedUsers?: string;
    isPrivate: boolean;
    answer?: string;
    answerAuthorName?: string;
    answerUpdatedAt?: string;
    createdAt: string;
}

const ALL_CATEGORY = '전체';

const matchesBoardFilters = (board: Board, searchQuery: string, categoryTab: string) => {
    const normalizedKeyword = searchQuery.trim().toLowerCase();
    const safeTitle = toSafePlainText(board.title).toLowerCase();
    const safeContent = toSafePlainText(board.content).toLowerCase();
    const matchesKeyword = !normalizedKeyword
        || safeTitle.includes(normalizedKeyword)
        || safeContent.includes(normalizedKeyword);
    const matchesCategory = categoryTab === ALL_CATEGORY || board.category === categoryTab;

    return matchesKeyword && matchesCategory;
};

export const InquiryBoardPage = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    // 2차 비밀번호 인증 상태
    const [isSecondAuthOpen, setIsSecondAuthOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [boards, setBoards] = useState<Board[]>([]);
    const [keyword, setKeyword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryTab, setCategoryTab] = useState(ALL_CATEGORY);
    const [openForm, setOpenForm] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

    const [formData, setFormData] = useState({ title: '', content: '', category: '사이트 문의', isPrivate: false });

    // 페이지 진입 시 2차 비밀번호 인증 여부는 글쓰기 시에 체크되므로 자동 모달 띄우기 제거

    const fetchBoards = async () => {
        const res = await apiClient.get('/board', { params: { keyword: searchQuery, category: categoryTab } });
        setBoards(res.data);
    };

    useEffect(() => {
        fetchBoards();
    }, [searchQuery, categoryTab]);

    const handleWriteClick = () => {
        if (!isAuthenticated) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
            return;
        }
        if (!isAuthorized) {
            setIsSecondAuthOpen(true);
        } else {
            setOpenForm(true);
        }
    };

    const handleSearch = () => {
        setSearchQuery(keyword);
    };

    const handleCreate = async () => {
        const payload = {
            ...formData,
            title: sanitizeBoardInput(formData.title),
            content: sanitizeBoardInput(formData.content),
        };
        const res = await apiClient.post<Board>('/board', payload);
        const createdBoard = res.data;

        setBoards((prev) => {
            if (!matchesBoardFilters(createdBoard, searchQuery, categoryTab)) {
                return prev;
            }

            const nextBoards = [createdBoard, ...prev.filter((board) => board.id !== createdBoard.id)];
            return nextBoards.sort((a, b) => b.id - a.id);
        });

        setOpenForm(false);
        setFormData({ title: '', content: '', category: '사이트 문의', isPrivate: false });
    };

    const handleDelete = async (id: number) => {
        await apiClient.delete(`/board/${id}`);
        setOpenDetail(false);
        fetchBoards();
    };

    const openBoardDetail = async (id: number) => {
        const res = await apiClient.get(`/board/${id}`);
        setSelectedBoard(res.data);
        setOpenDetail(true);
    };

    const handleSecondAuthSuccess = () => {
        setIsSecondAuthOpen(false);
        setIsAuthorized(true);
        setOpenForm(true); // 2차 인증 성공 시 바로 글쓰기 모달 열기
    };

    const handleSecondAuthClose = () => {
        setIsSecondAuthOpen(false);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* 독립적인 Header (ShoppingPage와 유사) */}
            <AppBar position="static" sx={{ bgcolor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography component={RouterLink} to="/" variant="h5" sx={{ fontWeight: 800, color: '#d32f2f', letterSpacing: -1, textDecoration: 'none', '&:hover': { opacity: 0.8 } }}>
                                MyCard
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {isAuthenticated ? (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="body2" sx={{ color: '#333', fontWeight: 600 }}>
                                        {user?.name}님
                                    </Typography>
                                    <Button
                                        variant="text"
                                        onClick={async () => { await logout(); navigate('/'); }}
                                        sx={{ color: '#666', fontWeight: 500, '&:hover': { color: '#d32f2f', bgcolor: 'transparent' } }}
                                    >
                                        로그아웃
                                    </Button>
                                    <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                                        My카드
                                    </Button>
                                </Stack>
                            ) : (
                                <>
                                    <Button component={RouterLink} to="/login" variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}>
                                        로그인
                                    </Button>
                                    <Button component={RouterLink} to="/register" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                                        회원가입
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* 본문 콘텐츠 (인증 전에 보여지지 않게 할지 여부, 지금은 틀만 렌더링) */}
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>문의게시판</Typography>

                <>
                        <Tabs value={categoryTab} onChange={(_, v) => setCategoryTab(v)} sx={{ mb: 3 }}>
                            <Tab label="전체" value="전체" />
                            <Tab label="사이트 문의" value="사이트 문의" />
                            <Tab label="금융 문의" value="금융 문의" />
                        </Tabs>

                        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                            <TextField
                                label="검색어"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <Button variant="contained" onClick={handleSearch}>검색</Button>
                            <Button variant="outlined" onClick={handleWriteClick}>글쓰기</Button>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="10%">번호</TableCell>
                                        <TableCell width="30%">제목</TableCell>
                                        <TableCell width="10%">카테고리</TableCell>
                                        <TableCell width="15%">작성자</TableCell>
                                        <TableCell width="10%">비공개</TableCell>
                                        <TableCell width="15%">작성일</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {boards.map((b) => (
                                        <TableRow key={b.id} hover>
                                            <TableCell>{b.id}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="text"
                                                    onClick={() => openBoardDetail(b.id)}
                                                    sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', textTransform: 'none' }}
                                                >
                                                    {toSafePlainText(b.title)}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{b.category || '전체'}</TableCell>
                                            <TableCell>{toSafePlainText(b.authorName)}</TableCell>
                                            <TableCell>{b.isPrivate ? '🔒' : ''}</TableCell>
                                            <TableCell>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {boards.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">게시글이 없습니다.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* 글쓰기 다이얼로그 */}
                        <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
                            <DialogTitle>새 게시글 작성</DialogTitle>
                            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                                <TextField
                                    label="제목"
                                    fullWidth
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                                <FormControl fullWidth size="small">
                                    <InputLabel>카테고리</InputLabel>
                                    <Select
                                        value={formData.category}
                                        label="카테고리"
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as string })}
                                    >
                                        <MenuItem value="사이트 문의">사이트 문의</MenuItem>
                                        <MenuItem value="금융 문의">금융 문의</MenuItem>
                                    </Select>
                                </FormControl>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPrivate}
                                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                        id="isPrivate"
                                    />
                                    <label htmlFor="isPrivate">비공개 (작성자와 관리자만 확인 가능)</label>
                                </Box>

                                <TextField
                                    label="내용"
                                    fullWidth
                                    multiline
                                    rows={5}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenForm(false)}>취소</Button>
                                <Button onClick={handleCreate} variant="contained">저장</Button>
                            </DialogActions>
                        </Dialog>

                        <Dialog open={openDetail} onClose={() => setOpenDetail(false)} fullWidth maxWidth="sm">
                            {selectedBoard && (
                                <>
                                    <DialogTitle>{toSafePlainText(selectedBoard.title)}</DialogTitle>
                                    <DialogContent dividers>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            작성자: {toSafePlainText(selectedBoard.authorName)} | 작성일: {new Date(selectedBoard.createdAt).toLocaleString()}
                                        </Typography>
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, minHeight: 100 }}>
                                            <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {toSafePlainText(selectedBoard.content)}
                                            </Typography>
                                        </Box>

                                        {selectedBoard.answer && (
                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                    관리자 답변
                                                </Typography>
                                                <Box sx={{ p: 2, border: '1px solid #e1e9f8', borderRadius: 2, bgcolor: '#f7fbff' }}>
                                                    <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {toSafePlainText(selectedBoard.answer)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
                                                        {toSafePlainText(selectedBoard.answerAuthorName || '관리자')}
                                                        {selectedBoard.answerUpdatedAt ? ` · ${new Date(selectedBoard.answerUpdatedAt).toLocaleString('ko-KR')}` : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={() => handleDelete(selectedBoard.id)} color="error">삭제</Button>
                                        <Button onClick={() => setOpenDetail(false)}>닫기</Button>
                                    </DialogActions>
                                </>
                            )}
                        </Dialog>
                    </>
            </Container>

            {/* 2차 비밀번호 인증 모달 */}
            <SecondAuthDialog
                open={isSecondAuthOpen}
                onClose={handleSecondAuthClose}
                onSuccess={handleSecondAuthSuccess}
            />

            <ChatBot />
        </Box>
    );
};
