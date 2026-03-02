package com.mycard.api.controller;

import com.mycard.api.dto.coupon.CouponPurchaseRequest;
import com.mycard.api.dto.coupon.CouponPurchaseResponse;
import com.mycard.api.dto.coupon.UserCouponResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "쿠폰", description = "e쿠폰 관련 API")
@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @Operation(summary = "내 쿠폰 목록 조회")
    @GetMapping("/my")
    public ResponseEntity<Page<UserCouponResponse>> getMyCoupons(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(couponService.getMyCoupons(principal, pageable));
    }

    @Operation(summary = "쿠폰 교환/구매")
    @PostMapping("/purchase")
    public ResponseEntity<CouponPurchaseResponse> purchaseCoupon(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CouponPurchaseRequest request) {
        CouponPurchaseResponse response = couponService.purchase(principal, request);
        return ResponseEntity.ok(response);
    }
}
