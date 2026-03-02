package com.mycard.api.service;

import com.mycard.api.dto.coupon.CouponPurchaseRequest;
import com.mycard.api.dto.coupon.CouponPurchaseResponse;
import com.mycard.api.dto.coupon.UserCouponResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.CouponCatalog;
import com.mycard.api.entity.PointLedger;
import com.mycard.api.entity.PointBalance;
import com.mycard.api.entity.User;
import com.mycard.api.entity.UserCoupon;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.repository.CouponCatalogRepository;
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

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponCatalogRepository couponCatalogRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserRepository userRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final PointLedgerRepository pointLedgerRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<UserCouponResponse> getMyCoupons(UserPrincipal principal, Pageable pageable) {
        return userCouponRepository.findByUserId(principal.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public CouponPurchaseResponse purchase(UserPrincipal principal, CouponPurchaseRequest request) {
        int quantity = request.getQuantity() == null ? 1 : request.getQuantity();
        Long couponId = request.getCoupon().getId();

        CouponCatalog catalog = couponCatalogRepository.findByIdAndActiveTrue(couponId)
                .orElseThrow(() -> new BadRequestException("유효하지 않은 쿠폰입니다."));

        Long unitCost = catalog.getPointCost();
        Long totalCost = unitCost * quantity;

        User user = userRepository.getReferenceById(principal.getId());

        PointBalance balance = pointBalanceRepository.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> pointBalanceRepository.save(new PointBalance(user)));

        BigDecimal totalPoints = BigDecimal.valueOf(totalCost);

        if (balance.getAvailablePoints().compareTo(totalPoints) < 0) {
            throw new BadRequestException("보유 포인트가 부족합니다.");
        }

        balance.usePoints(totalPoints);
        pointBalanceRepository.save(balance);

        LocalDateTime purchasedAt = LocalDateTime.now();
        LocalDateTime validUntil = purchasedAt.plusYears(1);

        List<UserCoupon> userCoupons = new ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            userCoupons.add(new UserCoupon(user, couponId, purchasedAt, validUntil));
        }
        List<UserCoupon> savedCoupons = userCouponRepository.saveAll(userCoupons);

        Long referenceId = savedCoupons.isEmpty() ? null : savedCoupons.get(0).getId();

        PointLedger ledger = new PointLedger(
                user,
                PointLedger.TransactionType.SPEND,
                totalPoints.negate(),
                balance.getAvailablePoints(),
                String.format("쿠폰 교환: couponId=%d, quantity=%d", couponId, quantity));
        ledger.setReferenceType("Coupon");
        ledger.setReferenceId(referenceId);
        pointLedgerRepository.save(ledger);

        String note = String.format("쿠폰 %d x %d 교환 (포인트 %d 차감)", couponId, quantity, totalCost);
        auditService.log(AuditLog.ActionType.CREATE, "UserCoupon", referenceId, note);

        return CouponPurchaseResponse.builder()
                .success(true)
                .couponId(couponId)
                .quantity(quantity)
                .deductedPoints(totalCost)
                .build();
    }

    private UserCouponResponse toResponse(UserCoupon userCoupon) {
        return UserCouponResponse.builder()
                .purchaseId(userCoupon.getId())
                .couponId(userCoupon.getCouponId())
                .status(userCoupon.getStatus() != null ? userCoupon.getStatus().name() : null)
                .purchasedAt(userCoupon.getPurchasedAt())
                .validUntil(userCoupon.getValidUntil())
                .pinCode(userCoupon.getPinCode())
                .coupon(new UserCouponResponse.CouponRef(userCoupon.getCouponId()))
                .build();
    }
}
