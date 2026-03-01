import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Badge,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Grid,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Toolbar,
    Typography,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/contexts/AuthContext';
import { pointsApi, couponsApi } from '@/api';
import { format } from 'date-fns';

/* ─── 카테고리 ─── */
const categories = [
    { key: 'all', label: '전체', icon: <CardGiftcardIcon /> },
    { key: 'convenience', label: '편의점', icon: <StorefrontIcon /> },
    { key: 'cafe', label: '카페', icon: <LocalCafeIcon /> },
    { key: 'food', label: '외식', icon: <FastfoodIcon /> },
    { key: 'department', label: '백화점/쇼핑', icon: <LocalMallIcon /> },
    { key: 'gas', label: '주유', icon: <LocalGasStationIcon /> },
    { key: 'voucher', label: '상품권', icon: <ConfirmationNumberIcon /> },
];

/* ─── e쿠폰 데이터 ─── */
interface Coupon {
    id: number;
    name: string;
    brand: string;
    category: string;
    points: number;
    originalPrice: number;
    image: string;
    badge?: string;
    description: string;
}

interface CartItem {
    coupon: Coupon;
    quantity: number;
}

const DISCOUNT_RATE = 0.8; // 20% 할인

const coupons: Coupon[] = [
    { id: 1, name: 'GS25 모바일 상품권 5천원', brand: 'GS25', category: 'convenience', points: 5000 * DISCOUNT_RATE, originalPrice: 5000, image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80', badge: '인기', description: 'GS25 전 매장에서 사용 가능한 모바일 상품권입니다.' },
    { id: 2, name: 'CU 모바일 상품권 1만원', brand: 'CU', category: 'convenience', points: 10000 * DISCOUNT_RATE, originalPrice: 10000, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', description: 'CU 전 매장에서 사용 가능한 모바일 상품권입니다.' },
    { id: 3, name: '이마트24 모바일 상품권 5천원', brand: '이마트24', category: 'convenience', points: 5000 * DISCOUNT_RATE, originalPrice: 5000, image: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&q=80', description: '이마트24 전 매장에서 사용 가능한 모바일 상품권입니다.' },
    { id: 4, name: '스타벅스 아메리카노 T', brand: '스타벅스', category: 'cafe', points: 4500 * DISCOUNT_RATE, originalPrice: 4500, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', badge: 'BEST', description: '스타벅스 전 매장에서 아메리카노 톨 사이즈 1잔으로 교환할 수 있습니다.' },
    { id: 5, name: '투썸플레이스 아이스 아메리카노 R', brand: '투썸플레이스', category: 'cafe', points: 4300 * DISCOUNT_RATE, originalPrice: 4300, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', description: '투썸플레이스 전 매장에서 아이스 아메리카노 레귤러 1잔으로 교환할 수 있습니다.' },
    { id: 6, name: '메가MGC커피 아메리카노 L', brand: '메가커피', category: 'cafe', points: 2000 * DISCOUNT_RATE, originalPrice: 2000, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', badge: '추천', description: '메가커피 전 매장에서 아메리카노 라지 1잔으로 교환할 수 있습니다.' },
    { id: 7, name: 'BBQ 황금올리브 치킨 교환권', brand: 'BBQ', category: 'food', points: 22000 * DISCOUNT_RATE, originalPrice: 22000, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80', description: 'BBQ 전 매장에서 황금올리브 치킨으로 교환할 수 있습니다.' },
    { id: 8, name: '맥도날드 빅맥세트 교환권', brand: '맥도날드', category: 'food', points: 7500 * DISCOUNT_RATE, originalPrice: 7500, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', description: '맥도날드 전 매장에서 빅맥 세트로 교환할 수 있습니다.' },
    { id: 9, name: '신세계백화점 상품권 5만원', brand: '신세계', category: 'department', points: 50000 * DISCOUNT_RATE, originalPrice: 50000, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80', badge: '프리미엄', description: '신세계백화점 전 점에서 사용 가능한 모바일 상품권입니다.' },
    { id: 10, name: '올리브영 모바일 상품권 1만원', brand: '올리브영', category: 'department', points: 10000 * DISCOUNT_RATE, originalPrice: 10000, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80', badge: '인기', description: '올리브영 전 매장에서 사용 가능한 모바일 상품권입니다.' },
    { id: 11, name: '현대백화점 상품권 3만원', brand: '현대백화점', category: 'department', points: 30000 * DISCOUNT_RATE, originalPrice: 30000, image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&q=80', description: '현대백화점 전 점에서 사용 가능한 모바일 상품권입니다.' },
    { id: 12, name: 'S-OIL 주유 상품권 3만원', brand: 'S-OIL', category: 'gas', points: 30000 * DISCOUNT_RATE, originalPrice: 30000, image: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=400&q=80', description: 'S-OIL 전 주유소에서 사용 가능한 모바일 주유 상품권입니다.' },
    { id: 13, name: 'GS칼텍스 주유 상품권 5만원', brand: 'GS칼텍스', category: 'gas', points: 50000 * DISCOUNT_RATE, originalPrice: 50000, image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&q=80', description: 'GS칼텍스 전 주유소에서 사용 가능한 모바일 주유 상품권입니다.' },
    { id: 14, name: '해피머니 온라인 상품권 1만원', brand: '해피머니', category: 'voucher', points: 10000 * DISCOUNT_RATE, originalPrice: 10000, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', description: '온라인 가맹점에서 사용 가능한 모바일 상품권입니다.' },
    { id: 15, name: '문화상품권 모바일 5천원', brand: '문화상품권', category: 'voucher', points: 5000 * DISCOUNT_RATE, originalPrice: 5000, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80', badge: '추천', description: '도서, 공연, 영화 등 문화생활에 사용 가능한 모바일 상품권입니다.' },
];

const CART_KEY = 'mycard_shopping_cart';

const formatPoints = (pts: number) => pts.toLocaleString('ko-KR');

const getBadgeColor = (badge: string) => {
    switch (badge) {
        case 'BEST': return '#d32f2f';
        case '인기': return '#e91e63';
        case '추천': return '#1976d2';
        case '프리미엄': return '#6a1b9a';
        default: return '#ff9800';
    }
};

/* ─── localStorage 유틸 ─── */
const loadCart = (): CartItem[] => {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return [];
        const ids: { id: number; quantity: number }[] = JSON.parse(raw);
        return ids
            .map((item) => {
                const coupon = coupons.find((c) => c.id === item.id);
                return coupon ? { coupon, quantity: item.quantity } : null;
            })
            .filter(Boolean) as CartItem[];
    } catch {
        return [];
    }
};

const saveCart = (cart: CartItem[]) => {
    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart.map((item) => ({ id: item.coupon.id, quantity: item.quantity }))),
    );
};

export const ShoppingPage = () => {
    const { isAuthenticated } = useAuth();
    const [selectedCat, setSelectedCat] = useState('all');
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cart, setCart] = useState<CartItem[]>(() => loadCart());
    const [cartOpen, setCartOpen] = useState(false);
    const [addedSnack, setAddedSnack] = useState('');
    const [myPoints, setMyPoints] = useState<number | null>(null);
    const [purchasedItems, setPurchasedItems] = useState<CartItem[]>([]);
    const [spentPoints, setSpentPoints] = useState(() => {
        try {
            return parseInt(localStorage.getItem('mock_spent_points') || '0', 10);
        } catch { return 0; }
    });

    // 쿠폰함 Drawer 상태 추가
    const [couponsDrawerOpen, setCouponsDrawerOpen] = useState(false);
    const [myCouponsList, setMyCouponsList] = useState<any[]>([]);


    // 로그인 시 보유 포인트 조회
    useEffect(() => {
        if (isAuthenticated) {
            pointsApi.balance()
                .then((data) => setMyPoints(Math.max(0, data.availablePoints - spentPoints)))
                .catch(() => setMyPoints(null));
        }
    }, [isAuthenticated, spentPoints]);

    // cart 변경 시 저장 (첫 렌더링 스킵)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        saveCart(cart);
    }, [cart]);

    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    const totalPoints = cart.reduce((sum, i) => sum + i.coupon.points * i.quantity, 0);

    const filtered = selectedCat === 'all'
        ? coupons
        : coupons.filter((c) => c.category === selectedCat);

    const addToCart = (coupon: Coupon) => {
        setCart((prev) => {
            const exists = prev.find((i) => i.coupon.id === coupon.id);
            if (exists) {
                return prev.map((i) => i.coupon.id === coupon.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { coupon, quantity: 1 }];
        });
        setAddedSnack(coupon.name);
        setTimeout(() => setAddedSnack(''), 2000);
    };

    const removeFromCart = (id: number) => {
        setCart((prev) => prev.filter((i) => i.coupon.id !== id));
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart((prev) =>
            prev.map((i) => {
                if (i.coupon.id !== id) return i;
                const newQty = i.quantity + delta;
                return newQty <= 0 ? i : { ...i, quantity: newQty };
            }),
        );
    };

    const handleExchange = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setDialogOpen(true);
    };

    const handleConfirmExchange = async () => {
        if (!selectedCoupon) return;

        const cost = selectedCoupon.points;
        if (myPoints === null || myPoints < cost) {
            alert('보유 포인트가 부족합니다.');
            setDialogOpen(false);
            return;
        }

        try {
            await couponsApi.purchase({ coupon: selectedCoupon, quantity: 1 });

            // 백엔드기를 안 타므로 프론트엔드 단에서 가상으로 깎음
            setSpentPoints(prev => {
                const next = prev + cost;
                localStorage.setItem('mock_spent_points', next.toString());
                return next;
            });
            setPurchasedItems([{ coupon: selectedCoupon, quantity: 1 }]);
            setDialogOpen(false);
            setConfirmOpen(true);
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.message || '포인트 교환에 실패했습니다.');
        }
    };

    const handleCartCheckout = async () => {
        const total = cart.reduce((sum, i) => sum + i.coupon.points * i.quantity, 0);

        if (myPoints === null || myPoints < total) {
            alert('보유 포인트가 부족합니다.');
            return;
        }

        try {
            // Mock API 로컬 스토리지 동시성 이슈를 위해 순차 처리
            for (const item of cart) {
                await couponsApi.purchase({ coupon: item.coupon, quantity: item.quantity });
            }

            setSpentPoints(prev => {
                const next = prev + total;
                localStorage.setItem('mock_spent_points', next.toString());
                return next;
            });

            setPurchasedItems([...cart]);
            setCartOpen(false);
            setCart([]);
            setConfirmOpen(true);
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.message || '포인트 교환에 실패했습니다.');
        }
    };

    const handleCheckoutDone = () => {
        setConfirmOpen(false);
        setSelectedCoupon(null);
        setPurchasedItems([]);
    };

    const handleOpenCouponsDrawer = async () => {
        if (!isAuthenticated) return;
        try {
            const data = await couponsApi.myList();

            // 백엔드가 준 구매 내역 + 프론트 하드코딩 쿠폰 상세정보 매핑
            const mappedCoupons = (Array.isArray(data) ? data : []).map(item => {
                const baseInfo = coupons.find(c => c.id === item.coupon?.id || c.id === item.couponId);
                return {
                    ...baseInfo, // 이름, 이미지, 브랜드 등
                    ...item,     // 유효기간, 상태, id
                    couponId: baseInfo?.id || item.coupon?.id || item.couponId
                };
            });

            setMyCouponsList(mappedCoupons);
            setCouponsDrawerOpen(true);
        } catch (e) {
            console.error(e);
            setMyCouponsList([]);
            setCouponsDrawerOpen(true);
        }
    };

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
                        <Stack direction="row" spacing={1} alignItems="center">
                            {/* 보유 포인트 */}
                            {isAuthenticated && myPoints !== null && (
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff5f5', px: 1.5, py: 0.5, borderRadius: 2, mr: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#666', mr: 0.5 }}>보유</Typography>
                                    <Typography sx={{ fontWeight: 800, color: '#d32f2f', fontSize: '0.95rem' }}>
                                        {formatPoints(myPoints)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#d32f2f', fontWeight: 600, ml: 0.3 }}>P</Typography>
                                </Box>
                            )}
                            {/* 내 쿠폰함 아이콘 */}
                            {isAuthenticated && (
                                <IconButton onClick={handleOpenCouponsDrawer} sx={{ color: '#d32f2f' }}>
                                    <ConfirmationNumberIcon />
                                </IconButton>
                            )}
                            {/* 장바구니 아이콘 */}
                            <IconButton onClick={() => setCartOpen(true)} sx={{ color: '#d32f2f' }}>
                                <Badge badgeContent={totalItems} color="error" max={99}>
                                    <ShoppingCartIcon />
                                </Badge>
                            </IconButton>
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
                        <ShoppingCartIcon sx={{ fontSize: 48 }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>포인트 쇼핑</Typography>
                            <Typography sx={{ opacity: 0.9 }}>MyCard 포인트로 다양한 e쿠폰을 교환하세요</Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            {/* 카테고리 탭 */}
            <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="lg">
                    <Tabs
                        value={selectedCat}
                        onChange={(_, v) => setSelectedCat(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { minHeight: 64, fontWeight: 600, fontSize: '0.9rem', color: '#666' },
                            '& .Mui-selected': { color: '#d32f2f !important' },
                            '& .MuiTabs-indicator': { bgcolor: '#d32f2f', height: 3 },
                        }}
                    >
                        {categories.map((cat) => (
                            <Tab
                                key={cat.key}
                                value={cat.key}
                                label={
                                    <Stack alignItems="center" spacing={0.5}>
                                        {cat.icon}
                                        <span>{cat.label}</span>
                                    </Stack>
                                }
                            />
                        ))}
                    </Tabs>
                </Container>
            </Box>

            {/* 담김 알림 */}
            {addedSnack && (
                <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1300, bgcolor: '#333', color: '#fff', px: 3, py: 1.5, borderRadius: 2, boxShadow: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddShoppingCartIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>장바구니에 담겼습니다</Typography>
                </Box>
            )}

            {/* e쿠폰 그리드 */}
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        e쿠폰 <Typography component="span" sx={{ color: '#d32f2f', fontWeight: 700 }}>{filtered.length}</Typography>개
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {filtered.map((coupon) => (
                        <Grid item xs={6} sm={4} md={3} key={coupon.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' },
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => handleExchange(coupon)}>
                                    <CardMedia component="img" image={coupon.image} alt={coupon.name} sx={{ height: 160, objectFit: 'cover' }} />
                                    {coupon.badge && (
                                        <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: getBadgeColor(coupon.badge), color: '#fff', px: 1.2, py: 0.3, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700 }}>
                                            {coupon.badge}
                                        </Box>
                                    )}
                                </Box>
                                <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>{coupon.brand}</Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mt: 0.5, mb: 1.5, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleExchange(coupon)}>
                                        {coupon.name}
                                    </Typography>
                                    <Box sx={{ mt: 'auto' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>
                                                {formatPoints(coupon.originalPrice)}P
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.7rem', color: '#d32f2f', fontWeight: 700 }}>20%</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#d32f2f', letterSpacing: -0.5 }}>
                                                    {formatPoints(coupon.points)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600 }}>P</Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                sx={{ bgcolor: '#fff5f5', color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}
                                                onClick={(e) => { e.stopPropagation(); addToCart(coupon); }}
                                            >
                                                <AddShoppingCartIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* 비로그인 CTA */}
                {!isAuthenticated && (
                    <Card sx={{ mt: 6, textAlign: 'center', py: 5, background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: '#fff', borderRadius: 3 }}>
                        <ShoppingCartIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            포인트로 e쿠폰을 교환해보세요!
                        </Typography>
                        <Typography sx={{ opacity: 0.9, mb: 3 }}>
                            MyCard에 가입하고 포인트를 적립하면 다양한 브랜드 e쿠폰으로 교환할 수 있습니다.
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button component={RouterLink} to="/register" variant="contained" size="large" sx={{ bgcolor: '#fff', color: '#d32f2f', '&:hover': { bgcolor: '#f5f5f5' } }}>
                                회원가입
                            </Button>
                            <Button component={RouterLink} to="/login" variant="outlined" size="large" sx={{ borderColor: '#fff', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                로그인
                            </Button>
                        </Stack>
                    </Card>
                )}
            </Container>

            {/* ─── 장바구니 Drawer ─── */}
            <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* 헤더 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <ShoppingCartIcon sx={{ color: '#d32f2f' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>장바구니</Typography>
                            <Chip label={`${totalItems}건`} size="small" sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 600 }} />
                        </Stack>
                        <IconButton onClick={() => setCartOpen(false)}><CloseIcon /></IconButton>
                    </Box>

                    {/* 아이템 목록 */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {cart.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <ShoppingCartIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
                                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>장바구니가 비어있습니다</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>원하는 e쿠폰을 담아보세요!</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {cart.map((item) => (
                                    <Card key={item.coupon.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Stack direction="row" spacing={1.5}>
                                                <Box
                                                    component="img"
                                                    src={item.coupon.image}
                                                    alt={item.coupon.name}
                                                    sx={{ width: 64, height: 64, borderRadius: 1, objectFit: 'cover' }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="caption" sx={{ color: '#999' }}>{item.coupon.brand}</Typography>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.coupon.name}
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                        {/* 수량 조절 */}
                                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: '#f5f5f5', borderRadius: 1, px: 0.5 }}>
                                                            <IconButton size="small" onClick={() => updateQuantity(item.coupon.id, -1)} disabled={item.quantity <= 1}>
                                                                <RemoveIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 20, textAlign: 'center' }}>
                                                                {item.quantity}
                                                            </Typography>
                                                            <IconButton size="small" onClick={() => updateQuantity(item.coupon.id, 1)}>
                                                                <AddIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Stack>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Typography sx={{ fontWeight: 700, color: '#d32f2f', fontSize: '0.9rem' }}>
                                                                {formatPoints(item.coupon.points * item.quantity)}P
                                                            </Typography>
                                                            <IconButton size="small" onClick={() => removeFromCart(item.coupon.id)} sx={{ color: '#999' }}>
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {/* 하단 합계 & 교환 버튼 */}
                    {cart.length > 0 && (
                        <Box sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography sx={{ fontWeight: 600, color: '#666' }}>총 교환 포인트</Typography>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#d32f2f' }}>
                                    {formatPoints(totalPoints)} <span style={{ fontSize: '0.85rem' }}>P</span>
                                </Typography>
                            </Stack>
                            {isAuthenticated ? (
                                <Button fullWidth variant="contained" size="large" onClick={handleCartCheckout} sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, fontWeight: 700, py: 1.5 }}>
                                    {totalItems}건 교환하기
                                </Button>
                            ) : (
                                <Button fullWidth component={RouterLink} to="/login" variant="contained" size="large" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, fontWeight: 700, py: 1.5 }}>
                                    로그인 후 교환하기
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            </Drawer>

            {/* 교환 상세 Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {selectedCoupon && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>e쿠폰 교환</Typography>
                        </DialogTitle>
                        <DialogContent>
                            <Box component="img" src={selectedCoupon.image} alt={selectedCoupon.name}
                                sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2, mb: 2 }} />
                            <Chip label={selectedCoupon.brand} size="small" sx={{ mb: 1, fontWeight: 600 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 1 }}>{selectedCoupon.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                                {selectedCoupon.description}
                            </Typography>
                            <Box sx={{ bgcolor: '#fff5f5', borderRadius: 2, p: 2, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">교환 포인트</Typography>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#d32f2f' }}>
                                    {formatPoints(selectedCoupon.points)} <span style={{ fontSize: '0.9rem' }}>P</span>
                                </Typography>
                            </Box>
                            {!isAuthenticated && (
                                <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 2, mt: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                                        e쿠폰 교환은 로그인 후 이용 가능합니다.
                                    </Typography>
                                    <Button component={RouterLink} to="/login" variant="contained" size="small" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                                        로그인하기
                                    </Button>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2, pt: 0 }}>
                            <Button onClick={() => setDialogOpen(false)} sx={{ color: '#666' }}>닫기</Button>
                            <Button
                                variant="outlined"
                                startIcon={<AddShoppingCartIcon />}
                                onClick={() => { addToCart(selectedCoupon); setDialogOpen(false); }}
                                sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
                            >
                                장바구니 담기
                            </Button>
                            {isAuthenticated && (
                                <Button variant="contained" onClick={handleConfirmExchange} sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                                    바로 교환
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* 교환 완료 Dialog */}
            <Dialog open={confirmOpen} onClose={handleCheckoutDone} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <Typography sx={{ fontSize: '2rem' }}>✓</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>교환 완료!</Typography>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                        e쿠폰이 성공적으로 교환되었습니다.
                    </Typography>
                    {purchasedItems.length > 0 && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            {purchasedItems.map((item) => (
                                <Typography key={item.coupon.id} variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                    {item.coupon.name} × {item.quantity} ({formatPoints(item.coupon.points * item.quantity)}P)
                                </Typography>
                            ))}
                            <Divider sx={{ my: 2 }} />
                            <Typography sx={{ color: '#d32f2f', fontWeight: 700 }}>
                                총 {formatPoints(purchasedItems.reduce((sum, i) => sum + i.coupon.points * i.quantity, 0))}P 차감
                            </Typography>
                        </>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        쿠폰은 마이페이지 &gt; 쿠폰함에서 확인하실 수 있습니다.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
                    <Button variant="outlined" onClick={handleCheckoutDone} sx={{ color: '#666', borderColor: '#ccc', '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' }, px: 3 }}>
                        계속 쇼핑하기
                    </Button>
                    <Button variant="contained" onClick={() => { setConfirmOpen(false); handleOpenCouponsDrawer(); }} sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, px: 4 }}>
                        내 쿠폰함 확인
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── 내 쿠폰함 드로워 ─── */}
            <Drawer anchor="right" open={couponsDrawerOpen} onClose={() => setCouponsDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>내 쿠폰함</Typography>
                    <IconButton onClick={() => setCouponsDrawerOpen(false)}><CloseIcon /></IconButton>
                </Box>
                <Box sx={{ p: 2, flex: 1, overflowY: 'auto', bgcolor: '#f9f9f9' }}>
                    {myCouponsList.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <ConfirmationNumberIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                            <Typography color="text.secondary">보유한 쿠폰이 없습니다.</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {myCouponsList.map((coupon) => (
                                <Card key={coupon.purchaseId} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', opacity: coupon.status !== 'AVAILABLE' ? 0.6 : 1 }}>
                                    <Box sx={{ display: 'flex', p: 1.5, gap: 1.5, borderBottom: '1px dashed #eee' }}>
                                        <Box component="img" src={coupon.image} alt={coupon.name} sx={{ width: 60, height: 60, borderRadius: 1.5, objectFit: 'cover' }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>{coupon.brand}</Typography>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, mt: 0.5 }}>{coupon.name}</Typography>
                                        </Box>
                                    </Box>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">유효기간</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>~ {format(new Date(coupon.validUntil), 'yyyy.MM.dd')}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                            <Chip label={coupon.status === 'AVAILABLE' ? '사용가능' : '사용완료'} color={coupon.status === 'AVAILABLE' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.7rem', height: 20 }} />
                                            <Typography variant="caption" color="text.secondary">수량: 1개</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Drawer>
        </Box>
    );
};
