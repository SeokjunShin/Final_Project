import { http, HttpResponse, passthrough } from 'msw';

// JWT 토큰 기반 REVIEWER 권한 확인 헬퍼
const isReviewer = (request: Request) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        return payload.roles && payload.roles.includes('ROLE_REVIEWER');
    } catch {
        return false;
    }
};

export const handlers = [
    // 1. 문서 검토 목록
    http.get('/api/admin/documents', ({ request }) => {
        if (!isReviewer(request)) return passthrough();

        return HttpResponse.json({
            content: [
                { id: 95101, title: 'income_proof_reviewer.pdf', docType: 'INCOME_PROOF', status: 'UNDER_REVIEW', submitterName: '김심사', rejectionReason: null, createdAt: '2026-03-05' },
                { id: 95102, title: 'id_card_front.jpg', docType: 'ID_CARD', status: 'APPROVED', submitterName: '이테스트', rejectionReason: null, createdAt: '2026-03-06' }
            ],
            totalElements: 2, totalPages: 1, number: 0, size: 20
        });
    }),

    // 문서 상태 변경 (승인, 반려)
    http.patch('/api/admin/documents/:id/status', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ message: "상태 변경 모의 성공" });
    }),

    // 문저 다운로드 임시
    http.get('/api/admin/documents/:id/download', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return new HttpResponse(new Blob(['mock data'], { type: 'application/pdf' }), {
            headers: { 'Content-Disposition': 'attachment; filename="mock.pdf"' }
        });
    }),

    // 2. 카드 신청 관리
    http.get('/api/admin/card-applications', ({ request }) => {
        if (!isReviewer(request)) return passthrough();

        return HttpResponse.json({
            content: [
                { id: 85101, userId: 1, fullName: '홍길동', email: 'user1@test.com', cardProduct: 'MyCard Platinum', cardType: 'CREDIT', employmentType: 'EMPLOYED', appliedLimit: 5000000, requestedCreditLimit: 5000000, status: 'PENDING', createdAt: '2026-03-01T10:00:00Z', requestedAt: '2026-03-01T10:00:00Z' },
                { id: 85102, userId: 2, fullName: '이영희', email: 'user2@test.com', cardProduct: 'MyCard Classic', cardType: 'CREDIT', employmentType: 'FREELANCER', appliedLimit: 2000000, requestedCreditLimit: 2000000, status: 'REVIEWING', createdAt: '2026-03-02T10:00:00Z', requestedAt: '2026-03-02T10:00:00Z' },
                { id: 85103, userId: 3, fullName: '박신용', email: 'user3@test.com', cardProduct: 'MyCard Blue', cardType: 'CHECK', employmentType: 'STUDENT', appliedLimit: 1500000, requestedCreditLimit: 0, status: 'APPROVED', createdAt: '2026-03-03T10:00:00Z', requestedAt: '2026-03-03T10:00:00Z' }
            ],
            totalElements: 3, totalPages: 1, number: 0, size: 20
        });
    }),

    // 2-1. 대기중인 카드 신청 건수
    http.get('/api/admin/card-applications/pending-count', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ count: 1 });
    }),

    // 2-2. 카드 신청 상세 조회
    http.get('/api/admin/card-applications/:id', ({ request, params }) => {
        if (!isReviewer(request)) return passthrough();
        const idStr = String(params.id);
        const nameMap: Record<string, string> = { "85101": "홍길동", "85102": "이영희", "85103": "박신용" };
        const statusMap: Record<string, string> = { "85101": "PENDING", "85102": "REVIEWING", "85103": "APPROVED" };

        return HttpResponse.json({
            id: Number(params.id),
            userId: idStr === "85101" ? 1 : 2,
            fullName: nameMap[idStr] || '가상신청자',
            email: `test${idStr}@mycard.local`,
            phone: '010-1234-5678',
            maskedSsn: '900101-1******',
            address: '서울시 강남구 테헤란로',
            addressDetail: '123번길 45',
            employmentType: idStr === "85101" ? 'EMPLOYED' : 'FREELANCER',
            employerName: idStr === "85101" ? '주식회사 테크' : '',
            jobTitle: idStr === "85101" ? '대리' : '',
            annualIncome: idStr === "85101" ? 45000000 : 30000000,
            cardProduct: idStr === "85101" ? 'MyCard Platinum' : 'MyCard Classic',
            cardType: 'CREDIT',
            requestedCreditLimit: idStr === "85101" ? 5000000 : 2000000,
            status: statusMap[idStr] || 'PENDING',
            createdAt: '2026-03-01T10:00:00Z',
            reviewedAt: idStr === "85103" ? '2026-03-04T10:00:00Z' : null,
            approvedCreditLimit: idStr === "85103" ? 2000000 : null
        });
    }),

    // 2-3. 카드 신청 상태 처리 (심사 시작, 승인, 거절)
    http.post('/api/admin/card-applications/:id/start-review', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ message: "심사시작 처리 완료 (Mock)" });
    }),
    http.post('/api/admin/card-applications/:id/approve', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ message: "승인 처리 완료 (Mock)" });
    }),
    http.post('/api/admin/card-applications/:id/reject', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ message: "거절 처리 완료 (Mock)" });
    }),

    // 3. 재발급 신청
    http.get('/api/admin/reissue-requests', ({ request }) => {
        if (!isReviewer(request)) return passthrough();

        return HttpResponse.json([
            { id: 1, cardId: 1001, cardNumberMasked: '****-****-****-1234', cardAlias: 'MyCard Platinum', cardProduct: 'MyCard Platinum', userId: 1, userName: '홍길동', userEmail: 'user1@mycard.local', reason: 'LOST', status: 'PENDING', requestedAt: '2026-03-10T11:00:00Z' },
            { id: 2, cardId: 2002, cardNumberMasked: '****-****-****-6789', cardAlias: 'MyCard Classic', cardProduct: 'MyCard Classic', userId: 2, userName: '김민수', userEmail: 'user2@mycard.local', reason: 'DAMAGED', status: 'COMPLETED', requestedAt: '2026-03-12T15:30:00Z', completedAt: '2026-03-13T09:00:00Z' }
        ]);
    }),

    // 3-1. 카드 재발급 완료 처리 모의
    http.patch('/api/admin/cards/:id/reissue-complete', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ message: "재발급 모의 처리 성공" });
    }),

    // 4. 대출 현황
    http.get('/api/loans', ({ request }) => {
        if (!isReviewer(request)) return passthrough();

        return HttpResponse.json({
            content: [
                { id: 99202, userId: 1, userName: '홍길동', loanType: 'CASH_ADVANCE', principalAmount: 500000, interestRate: 14.5, termMonths: 1, status: 'REQUESTED', requestedAt: '2026-03-08T09:00:00Z' },
                { id: 99203, userId: 2, userName: '김민수', loanType: 'CARD_LOAN', principalAmount: 3000000, interestRate: 11.2, termMonths: 12, status: 'APPROVED', requestedAt: '2026-03-09T14:00:00Z' }
            ],
            totalElements: 2, totalPages: 1, number: 0, size: 20
        });
    }),

    // 4-1. 대출 상세
    http.get('/api/loans/:id', ({ request, params }) => {
        if (!isReviewer(request)) return passthrough();
        const strId = String(params.id);
        const typeMap: Record<string, string> = { "99202": "CASH_ADVANCE", "99203": "CARD_LOAN" };

        return HttpResponse.json({
            id: Number(params.id), userId: strId === "99202" ? 1 : 2, userName: strId === "99202" ? '홍길동' : '김민수',
            loanType: typeMap[strId] || 'CASH_ADVANCE',
            principalAmount: strId === "99202" ? 500000 : 3000000,
            interestRate: strId === "99202" ? 14.5 : 11.2,
            termMonths: strId === "99202" ? 1 : 12,
            status: strId === "99202" ? 'REQUESTED' : 'APPROVED',
            requestedAt: '2026-03-08T09:00:00Z',
            repayments: []
        });
    }),

    // 4-2. 심사원 대출 승인/지급 거절 모의 처리
    http.patch('/api/admin/loans/:id/:action', ({ request }) => {
        if (!isReviewer(request)) return passthrough();
        return HttpResponse.json({ message: "대출 상태 변경 승인(Mock)" });
    })
];
