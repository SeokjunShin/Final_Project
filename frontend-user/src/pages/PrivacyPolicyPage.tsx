import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Box,
    Button,
    Collapse,
    Container,
    Divider,
    IconButton,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useAuth } from '@/contexts/AuthContext';

/* ─── 목차 데이터 ─── */
const TOC = [
    { id: 'art1', label: '제1조 개인정보의 처리 목적' },
    { id: 'art2', label: '제2조 개인정보의 처리 및 보유 기간' },
    { id: 'art3', label: '제3조 개인정보의 제3자 제공' },
    { id: 'art4', label: '제4조 개인정보처리의 위탁' },
    { id: 'art5', label: '제5조 정보주체의 권리·의무 및 행사방법' },
    { id: 'art6', label: '제6조 만 14세 미만 아동의 개인정보 처리' },
    { id: 'art7', label: '제7조 수집·처리하는 개인정보 항목' },
    { id: 'art8', label: '제8조 개인정보의 파기' },
    { id: 'art9', label: '제9조 개인정보의 안전성 확보 조치' },
    { id: 'art10', label: '제10조 개인정보 자동 수집 장치의 설치·운영 및 거부' },
    { id: 'art11', label: '제11조 행태정보의 수집·이용 및 거부' },
    { id: 'art12', label: '제12조 개인정보 보호책임자' },
    { id: 'art13', label: '제13조 개인정보 열람청구' },
    { id: 'art14', label: '제14조 권익침해 구제방법' },
    { id: 'art15', label: '제15조 영상정보처리기기 설치·운영' },
    { id: 'art16', label: '제16조 개인정보 처리방침 변경' },
];

/* ─── 아코디언 섹션 컴포넌트 ─── */
const Section = ({
    id,
    title,
    children,
    open,
    onToggle,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
    open: boolean;
    onToggle: () => void;
}) => (
    <Box id={id} sx={{ scrollMarginTop: 80 }}>
        <Box
            onClick={onToggle}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
                px: 2.5,
                cursor: 'pointer',
                borderBottom: '1px solid #e0e0e0',
                bgcolor: open ? '#fafafa' : '#fff',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: '#f5f5f5' },
            }}
        >
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#222' }}>
                {title}
            </Typography>
            {open ? (
                <ExpandLessIcon sx={{ color: '#d32f2f' }} />
            ) : (
                <ExpandMoreIcon sx={{ color: '#999' }} />
            )}
        </Box>
        <Collapse in={open}>
            <Box sx={{ px: 3, py: 2.5, bgcolor: '#fcfcfc', borderBottom: '1px solid #e0e0e0' }}>
                {children}
            </Box>
        </Collapse>
    </Box>
);

/* ─── 본문 텍스트 스타일 ─── */
const bodyStyle = { fontSize: '0.88rem', color: '#444', lineHeight: 1.85, mb: 1.5 };
const subStyle = { fontSize: '0.85rem', color: '#555', lineHeight: 1.8, pl: 2, mb: 1 };

/* ─── 테이블 스타일 ─── */
const thStyle = {
    border: '1px solid #ddd',
    p: 1.2,
    bgcolor: '#f5f5f5',
    fontWeight: 600,
    fontSize: '0.82rem',
    textAlign: 'center' as const,
};
const tdStyle = {
    border: '1px solid #ddd',
    p: 1.2,
    fontSize: '0.82rem',
    verticalAlign: 'top' as const,
};

export const PrivacyPolicyPage = () => {
    const { isAuthenticated } = useAuth();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const toggle = (id: string) =>
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

    const expandAll = () => {
        const all: Record<string, boolean> = {};
        TOC.forEach((t) => (all[t.id] = true));
        setOpenSections(all);
    };

    const collapseAll = () => setOpenSections({});

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
            {/* ─── Header ─── */}
            <AppBar position="sticky" sx={{ bgcolor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Typography
                            component={RouterLink}
                            to="/"
                            variant="h5"
                            sx={{ fontWeight: 800, color: '#d32f2f', letterSpacing: -1, textDecoration: 'none' }}
                        >
                            MyCard
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            {isAuthenticated ? (
                                <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                                    My카드
                                </Button>
                            ) : (
                                <>
                                    <Button component={RouterLink} to="/login" variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { bgcolor: '#fff5f5' } }}>
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

            {/* ─── 히어로 ─── */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                    py: { xs: 5, md: 7 },
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCardIcon sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                        개인정보 처리방침
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                        시행일자: 2025년 11월 24일
                    </Typography>
                </Container>
            </Box>

            {/* ─── 본문 ─── */}
            <Container maxWidth="md" sx={{ py: 5 }}>
                {/* 서문 */}
                <Box sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #eee' }}>
                    <Typography sx={{ ...bodyStyle, mb: 0 }}>
                        주식회사 마이카드(이하 "회사"라 함)는 개인정보보호를 매우 중요시하며, 「개인정보보호법」, 「신용정보의 이용 및 보호에 관한 법률」,
                        「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.
                        이에 「개인정보보호법」 제30조에 따라 정보주체에게 개인정보 처리에 관한 절차 및 기준을 안내하고,
                        이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                    </Typography>
                </Box>

                {/* 요약 카드 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 5 }}>
                    {[
                        { title: '수집 항목', desc: '성명, 이메일, 연락처, 카드번호, 거래내역 등' },
                        { title: '처리 목적', desc: '회원관리, 계약 이행, 서비스 제공, 민원처리 등' },
                        { title: '보유 기간', desc: '이용계약 해지일로부터 5년 (관계법령에 따름)' },
                    ].map((card) => (
                        <Box key={card.title} sx={{ p: 2.5, bgcolor: '#fff', border: '1px solid #e8e8e8', borderRadius: 2, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#d32f2f', mb: 0.5 }}>{card.title}</Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.6 }}>{card.desc}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* 목차 */}
                <Box sx={{ mb: 4, p: 2.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #eee' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>목 차</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
                        {TOC.map((t) => (
                            <Typography
                                key={t.id}
                                component="a"
                                href={`#${t.id}`}
                                sx={{
                                    fontSize: '0.83rem',
                                    color: '#555',
                                    textDecoration: 'none',
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: 1,
                                    transition: 'all 0.15s',
                                    '&:hover': { color: '#d32f2f', bgcolor: '#fff5f5' },
                                }}
                            >
                                {t.label}
                            </Typography>
                        ))}
                    </Box>
                </Box>

                {/* 전체 펼치기 / 접기 */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                    <Button size="small" onClick={expandAll} sx={{ color: '#d32f2f', fontSize: '0.8rem' }}>
                        전체 펼치기
                    </Button>
                    <Button size="small" onClick={collapseAll} sx={{ color: '#999', fontSize: '0.8rem' }}>
                        전체 접기
                    </Button>
                </Box>

                {/* ─── 각 조항 ─── */}
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                    {/* 제1조 */}
                    <Section id="art1" title="제1조 개인정보의 처리 목적" open={!!openSections['art1']} onToggle={() => toggle('art1')}>
                        <Typography sx={bodyStyle}>
                            회사는 다음과 같은 목적으로 최소한의 개인정보를 처리하고 있습니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
                            이용목적이 변경되는 경우에는 「개인정보보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                        </Typography>
                        <Typography sx={subStyle}>
                            ① <strong>회원관리</strong>: 회원제 서비스 이용에 따른 본인 확인·개인식별, 불량회원의 부정 이용 방지, 가입 의사 확인 및 가입 횟수 제한,
                            분쟁 조정을 위한 기록보존, 불만처리 등 민원처리, 고지사항 전달
                        </Typography>
                        <Typography sx={subStyle}>
                            ② <strong>계약 이행 및 서비스 제공</strong>: 카드 발급, 금융거래 본인 인증, 결제, 이용대금 청구·추심, 포인트 적립·사용, 카드 배송, 고객 상담, SMS·이메일 발송 등
                        </Typography>
                        <Typography sx={subStyle}>
                            ③ <strong>마케팅 및 광고</strong>: 이벤트·혜택 안내, 맞춤형 서비스 제공, 시장조사 및 상품 개발·연구, 통계학적 분석 등
                        </Typography>
                        <Typography sx={subStyle}>
                            ④ <strong>민원 처리</strong>: 고객 문의·불만 접수 시 본인확인, 내용 파악, 처리 결과 통보 등
                        </Typography>
                        <Typography sx={subStyle}>
                            ⑤ <strong>법령상 의무 이행</strong>: 관계 법령에 따른 의무 수행 등
                        </Typography>
                    </Section>

                    {/* 제2조 */}
                    <Section id="art2" title="제2조 개인정보의 처리 및 보유 기간" open={!!openSections['art2']} onToggle={() => toggle('art2')}>
                        <Typography sx={bodyStyle}>
                            개인정보의 처리 목적 달성 시까지 보유하며, 관계 법령에 의한 개인정보 보유 의무가 있는 경우에는 일정 기간 동안 보유한 뒤 파기합니다.
                        </Typography>
                        <Typography sx={subStyle}>
                            ① 회사는 고객이 탈회하거나, 고객을 제명하는 경우 권리남용 방지, 악용 방지, 각종 분쟁 대비 및 법규상의 의무 이행을 위하여 이용계약 해지일로부터
                            <strong> 5년</strong> 동안 개인정보를 보존합니다.
                        </Typography>
                        <Typography sx={subStyle}>② 아래의 정보에 대해서는 해당 기간 동안 보존합니다.</Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, mt: 1 }}>
                            <Box component="thead">
                                <Box component="tr">
                                    <Box component="th" sx={thStyle}>보존 근거</Box>
                                    <Box component="th" sx={thStyle}>보존 항목</Box>
                                    <Box component="th" sx={thStyle}>보존 기간</Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>전자상거래 등에서의 소비자보호에 관한 법률</Box>
                                    <Box component="td" sx={tdStyle}>계약 또는 청약철회 등에 관한 기록</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>5년</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>전자상거래 등에서의 소비자보호에 관한 법률</Box>
                                    <Box component="td" sx={tdStyle}>대금결제 및 재화 등의 공급에 관한 기록</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>5년</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>전자상거래 등에서의 소비자보호에 관한 법률</Box>
                                    <Box component="td" sx={tdStyle}>소비자의 불만 또는 분쟁처리에 관한 기록</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>3년</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>통신비밀보호법</Box>
                                    <Box component="td" sx={tdStyle}>로그인 기록</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>3개월</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>금융소비자 보호에 관한 법률</Box>
                                    <Box component="td" sx={tdStyle}>금융상품판매업 등의 업무 관련 자료</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>10년</Box>
                                </Box>
                            </Box>
                        </Box>
                        <Typography sx={subStyle}>
                            ③ 금융거래 없이 홈페이지에 가입한 회원이 1년 이상 로그인하지 않은 경우 해당 회원의 개인정보는 별도로 분리하여 보관합니다.
                        </Typography>
                    </Section>

                    {/* 제3조 */}
                    <Section id="art3" title="제3조 개인정보의 제3자 제공" open={!!openSections['art3']} onToggle={() => toggle('art3')}>
                        <Typography sx={bodyStyle}>
                            회사는 원칙적으로 고객의 개인정보를 수집한 목적 범위 내에서 처리하며 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
                        </Typography>
                        <Typography sx={subStyle}>① 고객이 사전에 동의한 경우</Typography>
                        <Typography sx={subStyle}>② 다른 법률에 특별한 규정이 있는 경우</Typography>
                        <Typography sx={subStyle}>③ 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</Typography>
                        <Typography sx={subStyle}>④ 회사가 법령상 의무를 준수하기 위하여 불가피하게 수집한 개인정보를 그 수집 목적 범위 내에서 제공하는 경우</Typography>
                        <Typography sx={subStyle}>⑤ 공중위생 등 공공의 안전과 안녕을 위하여 긴급히 필요한 경우</Typography>
                    </Section>

                    {/* 제4조 */}
                    <Section id="art4" title="제4조 개인정보처리의 위탁" open={!!openSections['art4']} onToggle={() => toggle('art4')}>
                        <Typography sx={bodyStyle}>
                            회사는 원활한 업무 처리를 위하여 다음과 같이 개인정보 처리를 위탁하고 있습니다. 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록
                            필요한 사항을 규정하고 있으며, 위탁 업무 내용이나 수탁자가 변경되는 경우에는 본 방침을 통하여 공개합니다.
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, mt: 1 }}>
                            <Box component="thead">
                                <Box component="tr">
                                    <Box component="th" sx={thStyle}>수탁자</Box>
                                    <Box component="th" sx={thStyle}>위탁 업무 내용</Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>카드 제조사</Box>
                                    <Box component="td" sx={tdStyle}>카드 제조 및 발급, 배송</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>결제 대행사</Box>
                                    <Box component="td" sx={tdStyle}>결제 처리, 이용대금 정산</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>고객센터 운영사</Box>
                                    <Box component="td" sx={tdStyle}>고객 상담, 민원 처리</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>SMS/이메일 발송사</Box>
                                    <Box component="td" sx={tdStyle}>안내 문자·이메일 발송</Box>
                                </Box>
                            </Box>
                        </Box>
                    </Section>

                    {/* 제5조 */}
                    <Section id="art5" title="제5조 정보주체의 권리·의무 및 행사방법" open={!!openSections['art5']} onToggle={() => toggle('art5')}>
                        <Typography sx={bodyStyle}>
                            정보주체(고객)는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                        </Typography>
                        <Typography sx={subStyle}>① 개인정보 열람 요구</Typography>
                        <Typography sx={subStyle}>② 오류 등이 있을 경우 정정 요구</Typography>
                        <Typography sx={subStyle}>③ 삭제 요구</Typography>
                        <Typography sx={subStyle}>④ 처리 정지 요구</Typography>
                        <Typography sx={{ ...bodyStyle, mt: 2 }}>
                            위 권리 행사는 회사에 대해 서면, 전화, 이메일, 홈페이지(마이페이지) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
                        </Typography>
                        <Typography sx={bodyStyle}>
                            정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.
                        </Typography>
                        <Typography sx={bodyStyle}>
                            권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여서도 하실 수 있습니다.
                            이 경우 「개인정보보호법 시행규칙」 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.
                        </Typography>
                    </Section>

                    {/* 제6조 */}
                    <Section id="art6" title="제6조 만 14세 미만 아동의 개인정보 처리" open={!!openSections['art6']} onToggle={() => toggle('art6')}>
                        <Typography sx={bodyStyle}>
                            회사는 만 14세 미만 아동의 개인정보를 처리하기 위하여 「개인정보보호법」 제22조에 따라 법정대리인의 동의를 받습니다.
                            아동의 법정대리인은 아동의 개인정보에 대한 열람, 정정·삭제, 처리 정지를 요구할 수 있습니다.
                        </Typography>
                        <Typography sx={bodyStyle}>
                            회사는 원칙적으로 만 14세 미만 아동의 개인정보를 수집하지 않으며, 부득이하게 수집해야 하는 경우 법정대리인의 동의를 반드시 받습니다.
                        </Typography>
                    </Section>

                    {/* 제7조 */}
                    <Section id="art7" title="제7조 수집·처리하는 개인정보 항목" open={!!openSections['art7']} onToggle={() => toggle('art7')}>
                        <Typography sx={bodyStyle}>회사는 다음과 같은 개인정보 항목을 수집·처리하고 있습니다.</Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, mt: 1 }}>
                            <Box component="thead">
                                <Box component="tr">
                                    <Box component="th" sx={thStyle}>구분</Box>
                                    <Box component="th" sx={thStyle}>수집 항목</Box>
                                    <Box component="th" sx={thStyle}>수집 방법</Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                <Box component="tr">
                                    <Box component="td" sx={{ ...tdStyle, fontWeight: 600 }}>회원가입 (필수)</Box>
                                    <Box component="td" sx={tdStyle}>성명, 이메일, 비밀번호, 전화번호</Box>
                                    <Box component="td" sx={tdStyle}>홈페이지 회원가입</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={{ ...tdStyle, fontWeight: 600 }}>카드 신청 (필수)</Box>
                                    <Box component="td" sx={tdStyle}>성명, 생년월일, 주소, 연락처, 직업, 연소득, 신분증 정보</Box>
                                    <Box component="td" sx={tdStyle}>카드 신청서</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={{ ...tdStyle, fontWeight: 600 }}>거래 정보</Box>
                                    <Box component="td" sx={tdStyle}>카드번호, 결제일, 결제금액, 가맹점 정보, 승인번호</Box>
                                    <Box component="td" sx={tdStyle}>카드 이용 시 자동 생성</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={{ ...tdStyle, fontWeight: 600 }}>자동 수집</Box>
                                    <Box component="td" sx={tdStyle}>IP 주소, 쿠키, 서비스 이용기록, 접속로그, 방문기록</Box>
                                    <Box component="td" sx={tdStyle}>서비스 이용 시 자동 수집</Box>
                                </Box>
                            </Box>
                        </Box>
                    </Section>

                    {/* 제8조 */}
                    <Section id="art8" title="제8조 개인정보의 파기" open={!!openSections['art8']} onToggle={() => toggle('art8')}>
                        <Typography sx={bodyStyle}>
                            회사는 개인정보의 처리 목적이 달성되면 아래의 절차와 방법에 따라 개인정보를 파기합니다.
                        </Typography>
                        <Typography sx={subStyle}>
                            ① 개인정보는 처리 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 관계 법령에 따라 일정 기간 보관된 후 파기됩니다.
                            별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 보존 이외의 다른 목적으로 이용되거나 제공되지 않습니다.
                        </Typography>
                        <Typography sx={subStyle}>
                            ② 전자적 파일 형태인 경우 복원이 불가능한 방법으로 영구 삭제하며, 그 외의 기록물, 인쇄물, 서면 등은 파쇄 또는 소각의 방법으로 파기합니다.
                        </Typography>
                    </Section>

                    {/* 제9조 */}
                    <Section id="art9" title="제9조 개인정보의 안전성 확보 조치" open={!!openSections['art9']} onToggle={() => toggle('art9')}>
                        <Typography sx={bodyStyle}>
                            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                        </Typography>
                        <Typography sx={subStyle}>① <strong>관리적 조치</strong>: 내부관리 계획 수립·시행, 개인정보 취급 직원의 최소화 및 교육 실시</Typography>
                        <Typography sx={subStyle}>② <strong>기술적 조치</strong>: 개인정보처리시스템 접근 권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</Typography>
                        <Typography sx={subStyle}>③ <strong>물리적 조치</strong>: 전산실, 자료보관실 등에 대한 접근 통제</Typography>
                        <Typography sx={subStyle}>④ <strong>접속기록 보관</strong>: 개인정보처리시스템에 접속한 기록을 최소 1년 이상 보관·관리</Typography>
                    </Section>

                    {/* 제10조 */}
                    <Section id="art10" title="제10조 개인정보 자동 수집 장치의 설치·운영 및 거부" open={!!openSections['art10']} onToggle={() => toggle('art10')}>
                        <Typography sx={bodyStyle}>
                            회사는 이용자에게 개별 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(Cookie)'를 사용합니다.
                        </Typography>
                        <Typography sx={subStyle}>
                            ① <strong>쿠키의 사용 목적</strong>: 이용자의 접속 빈도, 방문 시간, 이용 형태 등을 파악하여 이용자에게 최적화된 정보를 제공하기 위해 사용합니다.
                        </Typography>
                        <Typography sx={subStyle}>
                            ② <strong>쿠키의 설치·운영 및 거부</strong>: 웹 브라우저 상단의 "도구 {'>'} 인터넷옵션 {'>'} 개인정보" 메뉴의 옵션 설정을 통해
                            쿠키 저장을 거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.
                        </Typography>
                    </Section>

                    {/* 제11조 */}
                    <Section id="art11" title="제11조 행태정보의 수집·이용 및 거부" open={!!openSections['art11']} onToggle={() => toggle('art11')}>
                        <Typography sx={bodyStyle}>
                            회사는 서비스 이용 과정에서 정보주체에게 최적화된 맞춤형 서비스 및 혜택, 온라인 맞춤형 광고 등을 제공하기 위하여 행태정보를 수집·이용할 수 있습니다.
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, mt: 1 }}>
                            <Box component="thead">
                                <Box component="tr">
                                    <Box component="th" sx={thStyle}>수집 항목</Box>
                                    <Box component="th" sx={thStyle}>수집 방법</Box>
                                    <Box component="th" sx={thStyle}>수집 목적</Box>
                                    <Box component="th" sx={thStyle}>보유·이용 기간</Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>서비스 방문 이력, 검색·클릭 이력</Box>
                                    <Box component="td" sx={tdStyle}>이용자 웹/앱 방문 시 자동 수집</Box>
                                    <Box component="td" sx={tdStyle}>맞춤형 혜택·광고 제공</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>수집일로부터 1년</Box>
                                </Box>
                            </Box>
                        </Box>
                        <Typography sx={bodyStyle}>
                            이용자는 웹 브라우저의 쿠키 설정 변경 등을 통해 온라인 맞춤형 광고를 차단·허용할 수 있습니다.
                        </Typography>
                    </Section>

                    {/* 제12조 */}
                    <Section id="art12" title="제12조 개인정보 보호책임자" open={!!openSections['art12']} onToggle={() => toggle('art12')}>
                        <Typography sx={bodyStyle}>
                            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만,
                            피해 구제 등을 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1.5 }}>
                            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1.5, border: '1px solid #eee' }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#d32f2f', mb: 1 }}>개인정보 보호책임자</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#444', mb: 0.3 }}>성명: 홍길동</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#444', mb: 0.3 }}>직위: 정보보호최고책임자(CISO)</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#444' }}>연락처: 02-1588-0000</Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1.5, border: '1px solid #eee' }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#d32f2f', mb: 1 }}>개인정보 보호 담당부서</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#444', mb: 0.3 }}>부서명: 정보보호팀</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#444', mb: 0.3 }}>이메일: privacy@mycard.co.kr</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#444' }}>연락처: 02-1588-0001</Typography>
                            </Box>
                        </Box>
                    </Section>

                    {/* 제13조 */}
                    <Section id="art13" title="제13조 개인정보 열람청구" open={!!openSections['art13']} onToggle={() => toggle('art13')}>
                        <Typography sx={bodyStyle}>
                            정보주체는 「개인정보보호법」 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다.
                            회사는 정보주체의 개인정보 열람 청구가 신속하게 처리되도록 노력하겠습니다.
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1.5, border: '1px solid #eee', mt: 1 }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#444', mb: 0.3 }}>부서명: 정보보호팀</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: '#444', mb: 0.3 }}>이메일: privacy@mycard.co.kr</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: '#444' }}>연락처: 02-1588-0001</Typography>
                        </Box>
                    </Section>

                    {/* 제14조 */}
                    <Section id="art14" title="제14조 권익침해 구제방법" open={!!openSections['art14']} onToggle={() => toggle('art14')}>
                        <Typography sx={bodyStyle}>
                            정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에
                            분쟁 해결이나 상담 등을 신청할 수 있습니다.
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, mt: 1 }}>
                            <Box component="thead">
                                <Box component="tr">
                                    <Box component="th" sx={thStyle}>기관</Box>
                                    <Box component="th" sx={thStyle}>연락처</Box>
                                    <Box component="th" sx={thStyle}>홈페이지</Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>개인정보분쟁조정위원회</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>1833-6972</Box>
                                    <Box component="td" sx={tdStyle}>www.kopico.go.kr</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>개인정보침해신고센터 (한국인터넷진흥원)</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>118</Box>
                                    <Box component="td" sx={tdStyle}>privacy.kisa.or.kr</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>대검찰청 사이버수사과</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>1301</Box>
                                    <Box component="td" sx={tdStyle}>www.spo.go.kr</Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={tdStyle}>경찰청 사이버수사국</Box>
                                    <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>182</Box>
                                    <Box component="td" sx={tdStyle}>ecrm.police.go.kr</Box>
                                </Box>
                            </Box>
                        </Box>
                    </Section>

                    {/* 제15조 */}
                    <Section id="art15" title="제15조 영상정보처리기기 설치·운영" open={!!openSections['art15']} onToggle={() => toggle('art15')}>
                        <Typography sx={bodyStyle}>
                            회사는 아래와 같이 영상정보처리기기(CCTV)를 설치·운영하고 있습니다.
                        </Typography>
                        <Typography sx={subStyle}>① <strong>설치 목적</strong>: 시설 안전 및 화재 예방, 범죄 예방</Typography>
                        <Typography sx={subStyle}>② <strong>설치 대수</strong>: 본사 및 지점 영업장 내 설치</Typography>
                        <Typography sx={subStyle}>③ <strong>촬영 범위</strong>: 주요 출입구, 통로, 영업장 내부</Typography>
                        <Typography sx={subStyle}>④ <strong>보관 기간</strong>: 촬영일로부터 30일 이내</Typography>
                        <Typography sx={subStyle}>⑤ <strong>관리 책임자</strong>: 정보보호팀 (02-1588-0001)</Typography>
                    </Section>

                    {/* 제16조 */}
                    <Section id="art16" title="제16조 개인정보 처리방침 변경" open={!!openSections['art16']} onToggle={() => toggle('art16')}>
                        <Typography sx={bodyStyle}>
                            이 개인정보 처리방침은 <strong>2025년 11월 24일</strong>부터 적용됩니다.
                        </Typography>
                        <Typography sx={bodyStyle}>
                            이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.
                        </Typography>
                        <Typography sx={subStyle}>• 2025년 6월 1일 ~ 2025년 11월 23일 적용 개인정보 처리방침</Typography>
                        <Typography sx={subStyle}>• 2024년 12월 1일 ~ 2025년 5월 31일 적용 개인정보 처리방침</Typography>
                    </Section>
                </Box>

                <Divider sx={{ my: 5 }} />

                {/* 안내 문구 */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#999' }}>
                        본 개인정보 처리방침에 대해 궁금하신 사항이 있으시면 고객센터(1588-0000)로 문의해 주시기 바랍니다.
                    </Typography>
                </Box>
            </Container>

            {/* ─── Footer ─── */}
            <Box sx={{ bgcolor: '#1a1a1a', color: '#999', py: 4 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1, fontSize: '1rem' }}>MyCard</Typography>
                            <Typography variant="body2">© 2026 MyCard. All rights reserved.</Typography>
                        </Box>
                        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                            <Typography component={RouterLink} to="/" variant="body2" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                메인페이지
                            </Typography>
                            <Typography component={RouterLink} to="/privacy" variant="body2" sx={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                                개인정보처리방침
                            </Typography>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            {/* ─── 맨 위로 버튼 ─── */}
            {showTop && (
                <IconButton
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        bgcolor: '#d32f2f',
                        color: '#fff',
                        width: 48,
                        height: 48,
                        boxShadow: '0 4px 12px rgba(211,47,47,0.35)',
                        '&:hover': { bgcolor: '#b71c1c' },
                        zIndex: 1000,
                    }}
                >
                    <ArrowUpwardIcon />
                </IconButton>
            )}
        </Box>
    );
};
