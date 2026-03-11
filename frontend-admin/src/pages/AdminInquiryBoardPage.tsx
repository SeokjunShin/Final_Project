import { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { adminApiClient } from '@/api/client';
import { adminApi } from '@/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

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

export const AdminInquiryBoardPage = () => {
    useAdminAuth();

    const [boards, setBoards] = useState<Board[]>([]);
    const [keyword, setKeyword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryTab, setCategoryTab] = useState('전체');
    const [openForm, setOpenForm] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [answerData, setAnswerData] = useState('');

    const [formData, setFormData] = useState({ title: '', content: '', category: '사이트 문의', allowedUsers: '', isPrivate: false });

    const { data: usersData } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.users(),
    });

    const fetchBoards = async () => {
        const res = await adminApiClient.get('/board', { params: { keyword: searchQuery, category: categoryTab } });
        setBoards(res.data);
    };

    useEffect(() => {
        fetchBoards();
    }, [searchQuery, categoryTab]);

    const handleSearch = () => {
        setSearchQuery(keyword);
    };

    const handleCreate = async () => {
        await adminApiClient.post('/board', formData);
        setOpenForm(false);
        setFormData({ title: '', content: '', category: '사이트 문의', allowedUsers: '', isPrivate: false });
        fetchBoards();
    };

    const handleSaveAnswer = async () => {
        if (!selectedBoard) return;
        const res = await adminApiClient.put(`/board/${selectedBoard.id}`, {
            title: selectedBoard.title,
            content: selectedBoard.content,
            category: selectedBoard.category,
            allowedUsers: selectedBoard.allowedUsers,
            isPrivate: selectedBoard.isPrivate,
            answer: answerData,
        });
        setSelectedBoard(res.data);
        setAnswerData(res.data.answer || '');
        setBoards((prev) => prev.map((board) => (
            board.id === res.data.id ? res.data : board
        )));
    };

    const handleDelete = async (id: number) => {
        await adminApiClient.delete(`/board/${id}`);
        setOpenDetail(false);
        fetchBoards();
    };

    const openBoardDetail = async (id: number) => {
        const res = await adminApiClient.get(`/board/${id}`);
        setSelectedBoard(res.data);
        setAnswerData(res.data.answer || '');
        setOpenDetail(true);
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>게시판 문의 관리</Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Tabs value={categoryTab} onChange={(_, v) => setCategoryTab(v)} sx={{ mb: 3 }}>
                        <Tab label="전체" value="전체" />
                        <Tab label="사이트 문의" value="사이트 문의" />
                        <Tab label="금융 문의" value="금융 문의" />
                    </Tabs>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="검색 (SQL Injection 가능)"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleSearch}>검색</Button>
                        <Button variant="outlined" onClick={() => setOpenForm(true)}>새 공지/글 작성</Button>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
                                            <a href={b.title} onClick={(e) => {
                                                if (!b.title.startsWith('javascript:')) {
                                                    e.preventDefault();
                                                    openBoardDetail(b.id);
                                                }
                                            }} style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'none' }}>
                                                {b.title}
                                            </a>
                                        </TableCell>
                                        <TableCell>{b.category || '전체'}</TableCell>
                                        <TableCell>{b.authorName}</TableCell>
                                        <TableCell>{b.isPrivate ? '🔒' : ''}</TableCell>
                                        <TableCell>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                                {boards.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">게시글이 없습니다.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* 글쓰기 다이얼로그 */}
            <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
                <DialogTitle>새 공지/답변 작성</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        label="제목 (href 속성에 들어갑니다)"
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
                            id="isPrivateAdmin"
                        />
                        <label htmlFor="isPrivateAdmin">비공개 (작성자와 허용된 사용자만 확인 가능)</label>
                    </Box>
                    <Autocomplete
                        multiple
                        size="small"
                        options={usersData || []}
                        getOptionLabel={(option: any) => `${option.name} (${option.email.split('@')[0]})`}
                        value={(usersData || []).filter((u: any) => formData.allowedUsers.split(',').filter(Boolean).includes(u.name))}
                        onChange={(_, newValue) => {
                            setFormData({ ...formData, allowedUsers: newValue.map((v: any) => v.name).join(',') });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="열람 허용 대상자 (선택하지 않으면 본인 및 모든 관리자 열람 가능)"
                                placeholder="사용자 검색"
                            />
                        )}
                    />
                    <TextField
                        label="내용 (Script 태그 등 HTML 사용 가능)"
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

            {/* 상세조회 다이얼로그 (XSS 취약점) */}
            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} fullWidth maxWidth="sm">
                {selectedBoard && (
                    <>
                        <DialogTitle>{selectedBoard.title}</DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                작성자: {selectedBoard.authorName} | 작성일: {new Date(selectedBoard.createdAt).toLocaleString()}
                            </Typography>
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, minHeight: 100 }}>
                                <div dangerouslySetInnerHTML={{ __html: selectedBoard.content }} />
                            </Box>

                            {selectedBoard.answer && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        등록된 답변
                                    </Typography>
                                    <Box sx={{ p: 2, border: '1px solid #e1e9f8', borderRadius: 2, bgcolor: '#f7fbff' }}>
                                        <div dangerouslySetInnerHTML={{ __html: selectedBoard.answer }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
                                            {selectedBoard.answerAuthorName || '관리자'}
                                            {selectedBoard.answerUpdatedAt ? ` · ${new Date(selectedBoard.answerUpdatedAt).toLocaleString('ko-KR')}` : ''}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }} color="primary">게시판 답변 작성 / 수정</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    placeholder="답변을 입력하세요 (HTML 태그 사용 가능)"
                                    value={answerData}
                                    onChange={(e) => setAnswerData(e.target.value)}
                                    variant="outlined"
                                    sx={{ bgcolor: '#fff' }}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleSaveAnswer} variant="contained" color="primary" sx={{ mr: 'auto' }}>답변 저장</Button>
                            <Button onClick={() => handleDelete(selectedBoard.id)} color="error">삭제</Button>
                            <Button onClick={() => setOpenDetail(false)}>닫기</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};
