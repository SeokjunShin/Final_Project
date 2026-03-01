package com.mycard.api.service;

import com.mycard.api.dto.coupon.CouponPurchaseRequest;
import com.mycard.api.dto.coupon.CouponPurchaseResponse;
import com.mycard.api.dto.coupon.MyCouponResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.PointBalance;
import com.mycard.api.entity.PointLedger;
import com.mycard.api.entity.User;
import com.mycard.api.entity.UserCoupon;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.repository.PointBalanceRepository;
import com.mycard.api.repository.PointLedgerRepository;
import com.mycard.api.repository.UserCouponRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CouponService {

    private static final Map<Long, Long> COUPON_POINT_COSTS = Map.ofEntries(
            Map.entry(1L, 4000L),
            Map.entry(2L, 8000L),
            Map.entry(3L, 4000L),
            Map.entry(4L, 3600L),
            Map.entry(5L, 3440L),
            Map.entry(6L, 1600L),
            Map.entry(7L, 17600L),
            Map.entry(8L, 6000L),
            Map.entry(9L, 40000L),
            Map.entry(10L, 8000L),
            Map.entry(11L, 24000L),
            Map.entry(12L, 24000L),
            Map.entry(13L, 40000L),
            Map.entry(14L, 8000L),
            Map.entry(15L, 4000L)
    );

    private final PointBalanceRepository pointBalanceRepository;
    private final PointLedgerRepository pointLedgerRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public CouponPurchaseResponse purchase(UserPrincipal currentUser, CouponPurchaseRequest request) {
        Long userId = currentUser.getId();
        Long couponId = request.getCoupon().getId();
        Integer quantity = request.getQuantity();

        Long unitCost = COUPON_POINT_COSTS.get(couponId);
        if (unitCost == null) {
            throw new BadRequestException("유효하지 않은 쿠폰입니다.");
        }

        long deductedPoints;
        try {
            deductedPoints = Math.multiplyExact(unitCost, quantity.longValue());
        } catch (ArithmeticException e) {
            throw new BadRequestException("요청 수량이 너무 큽니다.");
        }

        PointBalance balance = pointBalanceRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> createInitialBalance(userId));

        BigDecimal deductedAmount = BigDecimal.valueOf(deductedPoints);
        if (balance.getAvailablePoints().compareTo(deductedAmount) < 0) {
            throw new BadRequestException("보유 포인트가 부족합니다.");
        }

        balance.usePoints(deductedAmount);
        pointBalanceRepository.save(balance);

        User user = userRepository.getReferenceById(userId);
        LocalDateTime purchasedAt = LocalDateTime.now();
        LocalDateTime validUntil = purchasedAt.plusYears(1);

        List<UserCoupon> coupons = new ArrayList<>(quantity);
        for (int i = 0; i < quantity; i++) {
            coupons.add(new UserCoupon(user, couponId, UserCoupon.CouponStatus.AVAILABLE, purchasedAt, validUntil));
        }
        userCouponRepository.saveAll(coupons);

        PointLedger ledger = new PointLedger(
                user,
                PointLedger.TransactionType.SPEND,
                deductedAmount.negate(),
                balance.getAvailablePoints(),
                "e쿠폰 교환 (couponId=" + couponId + ", quantity=" + quantity + ")"
        );
        ledger.setReferenceType("Coupon");
        ledger.setReferenceId(couponId);
        pointLedgerRepository.save(ledger);

        auditService.log(
                AuditLog.ActionType.CREATE,
                "CouponPurchase",
                couponId,
                "e쿠폰 구매: couponId=" + couponId + ", quantity=" + quantity + ", deductedPoints=" + deductedPoints
        );

        return CouponPurchaseResponse.builder()
                .success(true)
                .deductedPoints(deductedPoints)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<MyCouponResponse> getMyCoupons(UserPrincipal currentUser, Pageable pageable) {
        return userCouponRepository.findByUserId(currentUser.getId(), pageable)
                .map(this::toMyCouponResponse);
    }

    private PointBalance createInitialBalance(Long userId) {
        User user = userRepository.getReferenceById(userId);
        PointBalance balance = new PointBalance(user);
        return pointBalanceRepository.save(balance);
    }

    private MyCouponResponse toMyCouponResponse(UserCoupon coupon) {
        return MyCouponResponse.builder()
                .couponId(coupon.getCouponId())
                .status(coupon.getStatus())
                .validUntil(coupon.getValidUntil())
                .purchasedAt(coupon.getPurchasedAt())
                .build();
    }
}
