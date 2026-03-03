import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Fab,
    IconButton,
    Typography,
    TextField,
    Stack,
    Fade,
    Chip,
    Button,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MenuIcon from '@mui/icons-material/Menu';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';

// ─── 타입 정의 ──────────────────────────────────────────
interface LinkButton {
    label: string;
    path: string;
}

interface ChatMessage {
    id: number;
    sender: 'bot' | 'user';
    text: string;
    timestamp: Date;
    quickReplies?: string[];
    linkButton?: LinkButton;
}

// ─── FAQ 응답 데이터 ──────────────────────────────────────
const FAQ_RESPONSES: { keywords: string[]; answer: string; quickReplies?: string[]; linkButton?: LinkButton }[] = [
    {
        keywords: ['카드 신청', '카드신청', '카드 만들', '카드만들', '신규 카드', '카드 발급'],
        answer: '카드 신청은 [카드 상품] 페이지에서 가능합니다 😊\n\n원하시는 카드를 선택하신 후 \'신청하기\' 버튼을 눌러주세요.\n\n현재 추천 카드:\n• MyCard Platinum - 해외 3% 적립\n• MyCard 체크 - 전 가맹점 0.5% 적립',
        quickReplies: ['카드 혜택', '연회비', '카드 한도'],
        linkButton: { label: '카드 상품 보러가기', path: '/cards/products' },
    },
    {
        keywords: ['카드 혜택', '혜택', '적립', '할인', '캐시백'],
        answer: 'MyCard의 주요 혜택을 안내드립니다! 🎁\n\n✅ Platinum - 해외 가맹점 3% 적립, 국내외 라운지 무료\n✅ 체크카드 - 전 가맹점 0.5% 적립, 연회비 없음\n\n자세한 혜택은 [카드 상품] 페이지에서 확인해 주세요.',
        quickReplies: ['카드 신청', '포인트 조회'],
        linkButton: { label: '카드 상품 보러가기', path: '/cards/products' },
    },
    {
        keywords: ['연회비', '연회비 얼마', '카드 비용'],
        answer: '카드별 연회비 안내입니다 💳\n\n• MyCard Platinum: 국내 30,000원 / 해외 30,000원\n• MyCard 체크: 연회비 없음 (무료)\n\n연회비는 카드 발급일 기준 매년 청구됩니다.',
        quickReplies: ['카드 신청', '카드 혜택'],
    },
    {
        keywords: ['한도', '카드 한도', '결제 한도', '한도 변경', '한도 증액'],
        answer: '카드 한도 관련 안내입니다 📋\n\n한도 조회 및 변경은 로그인 후 [카드 관리] 메뉴에서 가능합니다.\n\n• 일시불 한도\n• 할부 한도\n• 단기카드대출(현금서비스) 한도\n\n한도 상향은 신용평가에 따라 결정됩니다.',
        quickReplies: ['카드 관리', '고객센터'],
        linkButton: { label: '카드 관리 바로가기', path: '/cards' },
    },
    {
        keywords: ['분실', '카드 분실', '도난', '카드 잃어', '분실 신고'],
        answer: '카드 분실 시 즉시 조치해 주세요! 🚨\n\n1. 로그인 후 [카드 관리] → 카드 정지\n2. 고객센터 전화: 1588-0000\n3. 카드 재발급 신청\n\n분실 신고 즉시 카드가 정지되며,\n재발급은 영업일 기준 3~5일 소요됩니다.',
        quickReplies: ['카드 재발급', '고객센터'],
        linkButton: { label: '카드 관리 바로가기', path: '/cards' },
    },
    {
        keywords: ['재발급', '카드 재발급', '재발행'],
        answer: '카드 재발급 안내입니다 🔄\n\n로그인 후 [카드 관리] 메뉴에서 재발급을 신청할 수 있습니다.\n\n• 소요 기간: 영업일 기준 3~5일\n• 기존 카드번호와 다른 새 번호가 부여됩니다.\n• 자동결제 등록 가맹점에 새 카드번호를 변경해 주세요.',
        quickReplies: ['카드 관리', '배송 조회'],
        linkButton: { label: '카드 관리 바로가기', path: '/cards' },
    },
    {
        keywords: ['포인트', '포인트 조회', '포인트 확인', '적립금', '마일리지'],
        answer: '포인트 서비스 안내입니다 ⭐\n\n로그인 후 [포인트] 메뉴에서 확인 가능합니다.\n\n• 포인트 잔여/적립 내역 조회\n• 포인트 전환 (캐시백)\n• 포인트 쇼핑몰 이용\n\n포인트는 결제 후 영업일 기준 2~3일 내 적립됩니다.',
        quickReplies: ['포인트 사용', '포인트 적립률'],
        linkButton: { label: '포인트 조회하기', path: '/points' },
    },
    {
        keywords: ['포인트 사용', '포인트 쓰기', '포인트 전환', '캐시백'],
        answer: '포인트 사용 방법입니다 💰\n\n1. 캐시백 전환: 포인트 → 결제 대금 차감\n2. 포인트 쇼핑: 쇼핑몰에서 포인트로 결제\n3. 가맹점 사용: 포인트 가맹점에서 현장 사용\n\n* 최소 1,000P 이상부터 사용 가능합니다.',
        quickReplies: ['포인트 조회', '쇼핑'],
        linkButton: { label: '포인트 조회하기', path: '/points' },
    },
    {
        keywords: ['명세서', '이용대금', '결제 내역', '청구서', '결제금액'],
        answer: '이용대금 명세서 안내입니다 📄\n\n로그인 후 [이용대금 명세서] 메뉴에서 확인 가능합니다.\n\n• 당월 결제 예정 금액\n• 과거 결제 내역\n• CSV 다운로드 가능\n\n결제일은 매월 지정한 결제일에 자동 출금됩니다.',
        quickReplies: ['결제일 변경', '카드 관리'],
        linkButton: { label: '명세서 확인하기', path: '/statements' },
    },
    {
        keywords: ['대출', '론', '대출 신청', '대출 상품', '카드론'],
        answer: '대출 상품 안내입니다 🏦\n\n로그인 후 [금융/대출] 메뉴에서 신청 가능합니다.\n\n• 카드론: 카드 한도 내 대출\n• 리볼빙: 결제 금액 일부를 다음 달로 이월\n\n금리 및 한도는 개인 신용등급에 따라 다릅니다.',
        quickReplies: ['리볼빙', '금리 안내'],
        linkButton: { label: '대출 상품 보기', path: '/finance/loans' },
    },
    {
        keywords: ['고객센터', '전화번호', '상담', '상담원', '문의', '연락처'],
        answer: '고객센터 안내입니다 📞\n\n☎ 대표번호: 1588-0000\n⏰ 운영시간: 평일 09:00 ~ 18:00\n📧 이메일: support@mycard.co.kr\n📍 주소: 서울특별시 강남구 테헤란로 123\n\n1:1 문의는 로그인 후 [고객센터] 메뉴를 이용해 주세요.',
        quickReplies: ['1:1 문의', '영업시간'],
        linkButton: { label: '1:1 문의하기', path: '/support/inquiries' },
    },
    {
        keywords: ['이벤트', '프로모션', '행사', '이벤트 참여'],
        answer: '현재 진행 중인 이벤트를 확인해 보세요! 🎉\n\n[이벤트] 페이지에서 다양한 혜택과 프로모션을 확인하실 수 있습니다.\n\n이벤트 참여는 로그인 후 가능합니다.',
        quickReplies: ['카드 혜택', '포인트'],
        linkButton: { label: '이벤트 보러가기', path: '/events' },
    },
    {
        keywords: ['회원가입', '가입', '신규 가입', '가입 방법'],
        answer: '회원가입 방법 안내입니다 📝\n\n홈페이지 우측 상단 [회원가입] 버튼을 클릭해 주세요.\n\n필요 정보:\n• 이름, 이메일, 비밀번호\n• 휴대폰 번호\n• 본인 인증\n\n가입 후 카드 신청까지 한번에 가능합니다!',
        quickReplies: ['카드 신청', '로그인'],
        linkButton: { label: '회원가입 하러가기', path: '/register' },
    },
    {
        keywords: ['안녕', '하이', 'hello', 'hi', '반가워', '안녕하세요'],
        answer: '안녕하세요! 😊\nMyCard 챗봇입니다.\n\n무엇을 도와드릴까요?\n아래 자주 찾는 메뉴를 선택하시거나, 궁금한 내용을 입력해 주세요.',
        quickReplies: ['카드 신청', '포인트 조회', '고객센터', '이벤트'],
    },
    {
        keywords: ['감사', '고마워', '땡큐', 'thanks', 'thank'],
        answer: '도움이 되셨다면 기쁩니다! 😊\n\n추가로 궁금한 사항이 있으시면 언제든 물어봐 주세요.',
        quickReplies: ['처음으로', '고객센터'],
    },
    {
        keywords: ['쇼핑', '쇼핑몰', '포인트 쇼핑', '온라인 쇼핑'],
        answer: 'MyCard 쇼핑 안내입니다 🛒\n\n[쇼핑] 페이지에서 포인트로 상품을 구매할 수 있습니다.\n\n다양한 카테고리의 상품을 만나보세요!',
        quickReplies: ['포인트 조회', '카드 혜택'],
        linkButton: { label: '쇼핑몰 바로가기', path: '/shopping' },
    },
];

// 퀵 메뉴 목록 - 모두 채팅 응답으로 처리
const QUICK_MENUS = [
    { icon: <CreditCardIcon sx={{ fontSize: 16 }} />, label: '카드 신청' },
    { icon: <CardGiftcardIcon sx={{ fontSize: 16 }} />, label: '포인트 조회' },
    { icon: <AccountBalanceIcon sx={{ fontSize: 16 }} />, label: '이벤트' },
    { icon: <SupportAgentIcon sx={{ fontSize: 16 }} />, label: '고객센터' },
    { icon: <HelpOutlineIcon sx={{ fontSize: 16 }} />, label: '자주 묻는 질문' },
];

let msgId = 0;

// ─── 챗봇 응답 함수 ──────────────────────────────────────
const getBotResponse = (input: string): { answer: string; quickReplies?: string[]; linkButton?: LinkButton } => {
    const normalizedInput = input.toLowerCase().trim();

    // '자주 묻는 질문' 특수 처리
    if (normalizedInput === '자주 묻는 질문') {
        return {
            answer: '자주 묻는 질문 목록입니다 📋\n\n아래 항목을 선택해 주세요:',
            quickReplies: ['카드 신청', '카드 혜택', '포인트 조회', '카드 분실', '고객센터', '이벤트', '명세서', '대출'],
        };
    }

    for (const faq of FAQ_RESPONSES) {
        for (const keyword of faq.keywords) {
            if (normalizedInput.includes(keyword.toLowerCase())) {
                return { answer: faq.answer, quickReplies: faq.quickReplies, linkButton: faq.linkButton };
            }
        }
    }

    // 매칭 안 되면 기본 응답
    return {
        answer: '죄송합니다, 해당 질문에 대한 답변을 찾지 못했어요 😅\n\n아래 메뉴를 선택하시거나, 다른 키워드로 다시 질문해 주세요.\n\n자세한 상담이 필요하시면 고객센터(1588-0000)로 연락해 주세요.',
        quickReplies: ['카드 신청', '포인트 조회', '고객센터', '이벤트'],
    };
};

// ─── 컴포넌트 ──────────────────────────────────────────
export const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, scrollToBottom]);

    // 챗봇 열 때 초기 메시지
    const handleOpen = () => {
        setIsOpen(true);
        if (messages.length === 0) {
            setMessages([
                {
                    id: ++msgId,
                    sender: 'bot',
                    text: '안녕하세요! 😊\nMyCard 챗봇입니다.\n\n원하시는 메뉴를 선택하시거나,\n궁금한 내용을 입력해 주세요.',
                    timestamp: new Date(),
                    quickReplies: ['카드 신청', '포인트 조회', '고객센터', '이벤트'],
                },
            ]);
        }
        setTimeout(() => inputRef.current?.focus(), 300);
    };

    // 메시지 전송
    const handleSend = (text?: string) => {
        const msg = text || input.trim();
        if (!msg) return;

        // 사용자 메시지 추가
        const userMsg: ChatMessage = {
            id: ++msgId,
            sender: 'user',
            text: msg,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // 봇 응답 (타이핑 효과)
        setTimeout(() => {
            const response = getBotResponse(msg);
            const botMsg: ChatMessage = {
                id: ++msgId,
                sender: 'bot',
                text: response.answer,
                timestamp: new Date(),
                quickReplies: response.quickReplies,
                linkButton: response.linkButton,
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 600 + Math.random() * 600);
    };

    const handleQuickMenuClick = (menu: typeof QUICK_MENUS[0]) => {
        handleSend(menu.label);
        setShowQuickMenu(false);
    };

    return (
        <>
            {/* ── 플로팅 챗봇 버튼 ── */}
            <Fade in={!isOpen}>
                <Fab
                    onClick={handleOpen}
                    sx={{
                        position: 'fixed',
                        bottom: 28,
                        right: 28,
                        width: 64,
                        height: 64,
                        bgcolor: '#d32f2f',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(211,47,47,0.4)',
                        transition: 'all 0.3s ease',
                        zIndex: 1300,
                        '&:hover': {
                            bgcolor: '#b71c1c',
                            transform: 'scale(1.1)',
                            boxShadow: '0 6px 28px rgba(211,47,47,0.5)',
                        },
                        animation: 'chatbotPulse 2s infinite',
                        '@keyframes chatbotPulse': {
                            '0%': { boxShadow: '0 4px 20px rgba(211,47,47,0.4)' },
                            '50%': { boxShadow: '0 4px 30px rgba(211,47,47,0.6)' },
                            '100%': { boxShadow: '0 4px 20px rgba(211,47,47,0.4)' },
                        },
                    }}
                >
                    <SmartToyIcon sx={{ fontSize: 32 }} />
                </Fab>
            </Fade>

            {/* ── 챗봇 팝업 ── */}
            <Fade in={isOpen}>
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 28,
                        right: 28,
                        width: { xs: 'calc(100vw - 32px)', sm: 400 },
                        height: { xs: 'calc(100vh - 100px)', sm: 580 },
                        maxHeight: '80vh',
                        bgcolor: '#fff',
                        borderRadius: 3,
                        boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
                        display: isOpen ? 'flex' : 'none',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 1300,
                    }}
                >
                    {/* ── 헤더 ── */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                            color: '#fff',
                            px: 2.5,
                            py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <SmartToyIcon sx={{ fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                                    chatbot
                                </Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                                    MyBot
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton onClick={() => setIsOpen(false)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* ── 메시지 영역 ── */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            px: 2,
                            py: 2,
                            bgcolor: '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            scrollbarWidth: 'thin',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 2 },
                        }}
                    >
                        {messages.map((msg) => (
                            <Box key={msg.id}>
                                {/* 봇 메시지 */}
                                {msg.sender === 'bot' && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: '#d32f2f',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                mt: 0.5,
                                            }}
                                        >
                                            <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />
                                        </Box>
                                        <Box sx={{ maxWidth: '80%' }}>
                                            <Box
                                                sx={{
                                                    bgcolor: '#fff',
                                                    p: 2,
                                                    borderRadius: '4px 16px 16px 16px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: '#333', fontSize: '0.85rem' }}
                                                >
                                                    {msg.text}
                                                </Typography>
                                            </Box>
                                            {/* 페이지 이동 버튼 */}
                                            {msg.linkButton && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => navigate(msg.linkButton!.path)}
                                                    sx={{
                                                        mt: 1,
                                                        bgcolor: '#d32f2f',
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        '&:hover': { bgcolor: '#b71c1c' },
                                                    }}
                                                >
                                                    {msg.linkButton.label}
                                                </Button>
                                            )}
                                            {/* 퀵 리플라이 */}
                                            {msg.quickReplies && (
                                                <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 1 }}>
                                                    {msg.quickReplies.map((reply) => (
                                                        <Chip
                                                            key={reply}
                                                            label={reply}
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleSend(reply)}
                                                            sx={{
                                                                borderColor: '#d32f2f',
                                                                color: '#d32f2f',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                '&:hover': { bgcolor: '#fff5f5', borderColor: '#b71c1c' },
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
                                            )}
                                            <Typography variant="caption" sx={{ color: '#aaa', mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
                                                {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {/* 사용자 메시지 */}
                                {msg.sender === 'user' && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Box sx={{ maxWidth: '75%' }}>
                                            <Box
                                                sx={{
                                                    bgcolor: '#d32f2f',
                                                    color: '#fff',
                                                    p: 1.5,
                                                    borderRadius: '16px 4px 16px 16px',
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.85rem' }}>
                                                    {msg.text}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: '#aaa', mt: 0.5, display: 'block', textAlign: 'right', fontSize: '0.65rem' }}
                                            >
                                                {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        ))}

                        {/* 타이핑 인디케이터 */}
                        {isTyping && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: '#d32f2f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />
                                </Box>
                                <Box
                                    sx={{
                                        bgcolor: '#fff',
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: '4px 16px 16px 16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        display: 'flex',
                                        gap: 0.5,
                                        alignItems: 'center',
                                    }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 7,
                                                height: 7,
                                                borderRadius: '50%',
                                                bgcolor: '#bbb',
                                                animation: 'typingDot 1.4s infinite',
                                                animationDelay: `${i * 0.2}s`,
                                                '@keyframes typingDot': {
                                                    '0%, 60%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                                                    '30%': { opacity: 1, transform: 'scale(1.2)' },
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* ── 퀵 메뉴 ── */}
                    {showQuickMenu && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderTop: '1px solid #eee',
                                px: 2,
                                py: 1.5,
                            }}
                        >
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {QUICK_MENUS.map((menu) => (
                                    <Chip
                                        key={menu.label}
                                        icon={menu.icon}
                                        label={menu.label}
                                        variant="outlined"
                                        onClick={() => handleQuickMenuClick(menu)}
                                        sx={{
                                            borderColor: '#e0e0e0',
                                            color: '#555',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#fff5f5', borderColor: '#d32f2f', color: '#d32f2f' },
                                            '& .MuiChip-icon': { color: 'inherit' },
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* ── 입력 영역 ── */}
                    <Box
                        sx={{
                            borderTop: '1px solid #eee',
                            px: 1.5,
                            py: 1.5,
                            bgcolor: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexShrink: 0,
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={() => setShowQuickMenu(!showQuickMenu)}
                            sx={{
                                color: showQuickMenu ? '#d32f2f' : '#999',
                                '&:hover': { color: '#d32f2f' },
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            size="small"
                            placeholder="여기에 질문을 입력해 주세요."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#f5f5f5',
                                    fontSize: '0.85rem',
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: '#ddd' },
                                    '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
                                },
                            }}
                        />
                        <IconButton
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            sx={{
                                color: input.trim() ? '#d32f2f' : '#ccc',
                                '&:hover': { bgcolor: '#fff5f5' },
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Fade>
        </>
    );
};
