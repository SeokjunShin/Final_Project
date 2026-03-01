import { http, HttpResponse } from 'msw';

// 내 쿠폰함 더미 DB (localStorage 연동)
const getCoupons = () => {
    try {
        const data = localStorage.getItem('my_mock_coupons');
        if (!data) return [];
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveCoupons = (coupons: any[]) => {
    localStorage.setItem('my_mock_coupons', JSON.stringify(coupons));
};

export const handlers = [
    // 1. 내 쿠폰함 목록 조회 API
    http.get('/api/coupons/my', () => {
        return HttpResponse.json({ content: getCoupons() });
    }),

    // 2. 쿠폰 구매 저장 API (프론트엔드에서 교환 완료 시 호출)
    http.post('/api/coupons/purchase', async ({ request }) => {
        const body = await request.json() as any;
        const myCoupons = getCoupons();

        // 새 쿠폰 데이터 (구매 날짜, 유효기간 추가)
        const newCoupon = {
            ...body.coupon,
            purchaseId: Date.now(),
            quantity: body.quantity || 1,
            purchasedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1년 뒤
            status: 'AVAILABLE' // AVAILABLE, USED, EXPIRED
        };

        // 복수 수량일 경우 각각 하나씩 분리해서 저장
        for (let i = 0; i < (body.quantity || 1); i++) {
            myCoupons.unshift({ ...newCoupon, purchaseId: Date.now() + i });
        }

        saveCoupons(myCoupons);
        return HttpResponse.json({ success: true });
    }),

    // 3. 2차 비밀번호 검증 API (마이페이지 접근용)
    http.post('/api/auth/verify-second-password', async ({ request }) => {
        const body = await request.json() as any;
        if (body.secondaryPin === '444444') {
            return HttpResponse.json({ success: true });
        }
        return HttpResponse.json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }),
];
