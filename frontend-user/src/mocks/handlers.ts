import { http, HttpResponse } from 'msw';



export const handlers = [
    // 1. 내 쿠폰함 목록 조회 API (주석 처리하여 실제 API로 우회)
    // http.get('/api/coupons/my', () => {
    //     return HttpResponse.json({ content: getCoupons() });
    // }),

    // 2. 쿠폰 구매 저장 API (주석 처리하여 실제 API로 우회)
    // http.post('/api/coupons/purchase', async ({ request }) => {
    //     const body = await request.json() as any;
    //     const myCoupons = getCoupons();
    //
    //     // 새 쿠폰 데이터 (구매 날짜, 유효기간 추가)
    //     const newCoupon = {
    //         couponId: body.coupon?.id || body.couponId,
    //         purchaseId: Date.now(),
    //         purchasedAt: new Date().toISOString(),
    //         validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1년 뒤
    //         status: 'AVAILABLE' // AVAILABLE, USED, EXPIRED
    //     };
    //
    //     // 복수 수량일 경우 각각 하나씩 분리해서 저장
    //     for (let i = 0; i < (body.quantity || 1); i++) {
    //         myCoupons.unshift({ ...newCoupon, purchaseId: Date.now() + i });
    //     }
    //
    //     saveCoupons(myCoupons);
    //     return HttpResponse.json({ success: true });
    // }),

    // 3. 2차 비밀번호 검증 API (마이페이지 접근용)
    http.post('/api/auth/verify-second-password', async ({ request }) => {
        const body = await request.json() as any;
        if (body.secondaryPin === '444444') {
            return HttpResponse.json({ success: true });
        }
        return HttpResponse.json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }),
];
