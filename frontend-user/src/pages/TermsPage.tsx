import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Box,
    Container,
    Toolbar,
    Typography,
    Stack,
    Button,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useAuth } from '@/contexts/AuthContext';
import { ChatBot } from '@/components/common/ChatBot';
import { AppFooter } from '@/components/common/AppFooter';

// ─── 약관 데이터 ───────────────────────────────────────────

interface TermsSection {
    title: string;
    content: string;
}

interface TermsCategory {
    label: string;
    sections: TermsSection[];
}

const TERMS_DATA: TermsCategory[] = [
    {
        label: '회원 이용약관',
        sections: [
            {
                title: '제1조 (목적)',
                content: '이 약관은 MyCard 주식회사(이하 "회사"라 합니다)가 제공하는 신용카드, 체크카드 및 관련 금융서비스(이하 "서비스"라 합니다)의 이용조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항 등을 규정함을 목적으로 합니다.',
            },
            {
                title: '제2조 (용어의 정의)',
                content: '① "회원"이라 함은 이 약관에 동의하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.\n② "카드"라 함은 회사가 발행하는 신용카드, 체크카드 등을 말합니다.\n③ "포인트"라 함은 카드 이용 실적에 따라 적립되는 보상점수를 말합니다.\n④ "가맹점"이라 함은 회사와 계약을 체결하고 카드에 의한 거래를 회원에게 제공하는 자를 말합니다.',
            },
            {
                title: '제3조 (약관의 효력 및 변경)',
                content: '① 이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.\n② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 약관이 변경된 경우 변경 사항을 시행일자 15일 전부터 서비스 내 공지사항을 통해 게시합니다.\n③ 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.',
            },
            {
                title: '제4조 (서비스의 제공 및 변경)',
                content: '① 회사는 다음과 같은 서비스를 제공합니다.\n  1. 신용카드·체크카드 발급 및 이용 서비스\n  2. 포인트 적립 및 사용 서비스\n  3. e쿠폰 교환(포인트 쇼핑) 서비스\n  4. 이용대금 명세서 조회 서비스\n  5. 대출·리볼빙 등 금융 서비스\n  6. 이벤트 및 프로모션 서비스\n  7. 기타 회사가 정하는 서비스\n② 회사는 서비스의 내용을 변경할 경우 변경 내용을 사전에 공지합니다.',
            },
            {
                title: '제5조 (회원가입)',
                content: '① 서비스 이용을 희망하는 자는 회사가 정한 가입 양식에 따라 회원 정보를 기입한 후 이 약관에 동의한다는 의사 표시를 함으로써 회원가입을 신청합니다.\n② 회사는 다음 각 호에 해당하는 경우 회원가입을 승낙하지 않을 수 있습니다.\n  1. 등록 내용에 허위, 누락, 오기가 있는 경우\n  2. 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우',
            },
            {
                title: '제6조 (회원 탈퇴 및 자격 상실)',
                content: '① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다.\n② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원 자격을 제한 및 정지시킬 수 있습니다.\n  1. 가입 신청 시 허위 내용을 등록한 경우\n  2. 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 질서를 위협하는 경우\n  3. 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우',
            },
            {
                title: '제7조 (회원에 대한 통지)',
                content: '① 회사가 회원에 대한 통지를 하는 경우 회원이 등록한 이메일 주소 또는 SMS 등으로 할 수 있습니다.\n② 회사는 불특정 다수 회원에 대한 통지의 경우 서비스 게시판에 게시함으로써 개별 통지에 갈음할 수 있습니다.',
            },
        ],
    },
    {
        label: '전자금융거래 약관',
        sections: [
            {
                title: '제1조 (목적)',
                content: '이 약관은 MyCard 주식회사(이하 "회사")가 제공하는 전자금융거래 서비스를 이용자가 이용함에 있어 회사와 이용자 사이의 전자금융거래에 관한 기본적인 사항을 정함을 목적으로 합니다.',
            },
            {
                title: '제2조 (정의)',
                content: '① "전자금융거래"라 함은 회사가 전자적 장치를 통하여 제공하는 금융상품 및 서비스를 이용자가 전자적 장치를 통해 비대면·자동화된 방식으로 이용하는 거래를 말합니다.\n② "접근매체"라 함은 전자금융거래에 있어서 거래 지시를 하거나 이용자 및 거래 내용의 진실성과 정확성을 확보하기 위하여 사용되는 수단 또는 정보로서, 비밀번호, 인증서 등을 말합니다.',
            },
            {
                title: '제3조 (전자금융거래의 종류)',
                content: '회사가 제공하는 전자금융거래의 종류는 다음과 같습니다.\n  1. 카드 결제 서비스\n  2. 포인트 조회 및 사용 서비스\n  3. e쿠폰 교환 서비스\n  4. 이용대금 조회 서비스\n  5. 기타 회사가 정하는 전자금융거래 서비스',
            },
            {
                title: '제4조 (거래내용의 확인)',
                content: '① 회사는 이용자와 미리 약정한 전자적 방법을 통하여 이용자의 거래내용(이용자의 오류 정정 요구 사실 및 처리 결과에 관한 사항을 포함합니다)을 확인할 수 있도록 하며, 이용자의 요청이 있는 경우에는 서면으로 제공합니다.\n② 회사는 이용대금 명세서를 통해 거래내용을 확인할 수 있도록 합니다.',
            },
            {
                title: '제5조 (오류의 정정 등)',
                content: '① 이용자는 전자금융거래 서비스를 이용함에 있어 오류가 있음을 안 때에는 회사에 대하여 그 정정을 요구할 수 있습니다.\n② 회사는 이용자의 정정 요구를 받은 때에는 이를 조사하여 처리한 후 정정 요구를 받은 날부터 2주 이내에 그 결과를 이용자에게 알려드립니다.',
            },
            {
                title: '제6조 (접근매체의 관리)',
                content: '① 회사는 전자금융거래 서비스 제공 시 접근매체를 선정하여 이용자의 신원, 권한 및 거래 지시의 내용 등을 확인합니다.\n② 이용자는 접근매체를 제3자에게 대여하거나 사용을 위임하거나 양도 또는 담보 목적으로 제공할 수 없습니다.\n③ 이용자는 자신의 접근매체를 다른 사람에게 누설하지 않도록 관리하여야 합니다.\n④ 2차 비밀번호(6자리)는 안전한 서비스 이용을 위하여 설정되며, 이용자 본인의 책임 하에 관리합니다.',
            },
        ],
    },
    {
        label: '포인트 이용약관',
        sections: [
            {
                title: '제1조 (목적)',
                content: '이 약관은 MyCard 주식회사(이하 "회사")가 운영하는 포인트 서비스의 이용에 관한 제반 사항을 규정함을 목적으로 합니다.',
            },
            {
                title: '제2조 (포인트의 적립)',
                content: '① 포인트는 회원이 카드를 사용하여 결제할 때 결제금액의 일정 비율에 따라 적립됩니다.\n② 적립률은 카드 종류에 따라 다르며, 다음과 같습니다.\n  • MyCard Platinum: 1.5% 적립\n  • MyCard Gold: 1.0% 적립\n  • MyCard Blue: 0.8% 적립\n  • MyCard Classic: 0.7% 적립\n  • MyCard 체크: 0.3% 적립\n③ 포인트는 결제 후 영업일 기준 2~3일 이내에 적립됩니다.\n④ 이벤트 참여를 통해 추가 포인트가 적립될 수 있습니다.',
            },
            {
                title: '제3조 (포인트의 사용)',
                content: '① 적립된 포인트는 다음과 같은 용도로 사용할 수 있습니다.\n  1. 캐시백 전환: 포인트를 결제 대금에서 차감\n  2. 포인트 쇼핑: 포인트몰에서 e쿠폰 교환\n  3. 가맹점 현장 사용: 포인트 사용 가맹점에서 결제\n② 포인트 사용 시 최소 사용 가능 포인트는 1,000P 이상입니다.\n③ e쿠폰 교환 시 2차 비밀번호 인증이 필요합니다.',
            },
            {
                title: '제4조 (포인트의 소멸)',
                content: '① 포인트의 유효기간은 적립일로부터 5년입니다.\n② 유효기간이 경과한 포인트는 자동으로 소멸됩니다.\n③ 회원 탈퇴 시 미사용 포인트는 소멸됩니다.\n④ 회사는 포인트 소멸 30일 전에 회원에게 통지합니다.',
            },
            {
                title: '제5조 (포인트 쇼핑)',
                content: '① 포인트 쇼핑은 회사가 운영하는 포인트몰에서 포인트를 사용하여 e쿠폰 등 상품을 교환하는 서비스입니다.\n② e쿠폰은 교환 즉시 발행되며, PIN 번호가 제공됩니다.\n③ 교환된 e쿠폰은 환불 및 취소가 불가합니다.\n④ e쿠폰의 유효기간은 교환일로부터 90일이며, 유효기간 경과 후에는 사용이 불가합니다.',
            },
        ],
    },
    {
        label: '개인정보 수집·이용 동의',
        sections: [
            {
                title: '제1조 (수집하는 개인정보)',
                content: '회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.\n\n[필수 항목]\n  • 성명, 이메일 주소, 비밀번호\n  • 휴대폰 번호\n  • 주소\n\n[선택 항목]\n  • 생년월일\n  • 직업, 연소득 (카드 발급 심사용)',
            },
            {
                title: '제2조 (개인정보의 이용 목적)',
                content: '수집한 개인정보는 다음 목적을 위해 이용됩니다.\n  1. 회원 가입 및 관리: 회원제 서비스 이용, 본인 확인, 분쟁 조정을 위한 기록보존\n  2. 서비스 제공: 카드 발급, 포인트 적립/사용, 이벤트 참여 등\n  3. 마케팅 및 광고: 이벤트·프로모션 안내, 맞춤형 서비스 제공 (동의한 회원에 한함)\n  4. 서비스 개선: 서비스 이용 통계, 신규 서비스 개발',
            },
            {
                title: '제3조 (개인정보의 보유 및 이용 기간)',
                content: '① 회원의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체 없이 파기합니다.\n② 다만, 관련 법령에 의하여 보존할 필요가 있는 경우 다음과 같이 관련 법령에서 정한 기간 동안 보관합니다.\n  • 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)\n  • 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)\n  • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)\n  • 접속에 관한 기록: 1년 (통신비밀보호법)',
            },
            {
                title: '제4조 (개인정보의 제3자 제공)',
                content: '회사는 회원의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.\n  1. 회원이 사전에 동의한 경우\n  2. 법률의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우',
            },
            {
                title: '제5조 (개인정보의 안전성 확보 조치)',
                content: '회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.\n  1. 비밀번호 암호화: 회원의 비밀번호는 암호화되어 저장·관리됩니다.\n  2. 해킹 대비 조치: SSL/TLS 등 보안 프로토콜을 사용하여 데이터를 암호화 전송합니다.\n  3. 접근 제한: 개인정보에 대한 접근 권한을 최소한의 인원으로 제한합니다.\n  4. 2차 인증: 중요 거래 시 2차 비밀번호를 통한 추가 인증을 실시합니다.',
            },
        ],
    },
];

export const TermsPage = () => {
    const { isAuthenticated } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [expanded, setExpanded] = useState<string | false>('section-0');

    const currentTerms = TERMS_DATA[tabValue];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <AppBar position="static" sx={{ bgcolor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography component={RouterLink} to="/" variant="h5" sx={{ fontWeight: 800, color: '#d32f2f', letterSpacing: -1, textDecoration: 'none', '&:hover': { opacity: 0.8 } }}>
                                MyCard
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            {isAuthenticated ? (
                                <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                                    My카드
                                </Button>
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

            {/* Hero */}
            <Box sx={{ bgcolor: '#d32f2f', color: '#fff', py: 5 }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <CreditCardIcon sx={{ fontSize: 48 }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>이용약관</Typography>
                            <Typography sx={{ opacity: 0.9 }}>MyCard 서비스 이용에 관한 약관을 확인하실 수 있습니다</Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            {/* 탭 */}
            <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                <Container maxWidth="lg">
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => { setTabValue(v); setExpanded('section-0'); }}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { fontWeight: 600, fontSize: '0.9rem', minHeight: 56 },
                            '& .Mui-selected': { color: '#d32f2f !important' },
                            '& .MuiTabs-indicator': { bgcolor: '#d32f2f', height: 3 },
                        }}
                    >
                        {TERMS_DATA.map((cat, idx) => (
                            <Tab key={idx} label={cat.label} />
                        ))}
                    </Tabs>
                </Container>
            </Box>

            {/* 약관 내용 */}
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    {currentTerms.sections.map((section, idx) => (
                        <Accordion
                            key={`${tabValue}-${idx}`}
                            expanded={expanded === `section-${idx}`}
                            onChange={(_, isExpanded) => setExpanded(isExpanded ? `section-${idx}` : false)}
                            disableGutters
                            elevation={0}
                            sx={{
                                '&:before': { display: 'none' },
                                borderBottom: idx < currentTerms.sections.length - 1 ? '1px solid #f0f0f0' : 'none',
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: '#d32f2f' }} />}
                                sx={{
                                    px: 3,
                                    py: 0.5,
                                    '&:hover': { bgcolor: '#fafafa' },
                                    '& .MuiAccordionSummary-content': { my: 1.5 },
                                }}
                            >
                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: expanded === `section-${idx}` ? '#d32f2f' : '#333' }}>
                                    {section.title}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                                <Box sx={{ bgcolor: '#fafafa', borderRadius: 1.5, p: 2.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.9,
                                            color: '#555',
                                            fontSize: '0.88rem',
                                        }}
                                    >
                                        {section.content}
                                    </Typography>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                {/* 하단 안내 */}
                <Box sx={{ mt: 4, p: 3, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        • 본 약관은 2024년 1월 1일부터 시행합니다.{'\n'}
                        • 약관에 대한 문의사항은 고객센터(☎ 1588-0000)로 연락해 주시기 바랍니다.{'\n'}
                        • 이 약관에서 정하지 아니한 사항은 관련 법령 및 상관례에 따릅니다.
                    </Typography>
                </Box>
            </Container>

            <AppFooter />
            <ChatBot />
        </Box>
    );
};
