package com.mycard.api.controller;

import com.mycard.api.dto.coupon.CouponPurchaseRequest;
import com.mycard.api.dto.coupon.CouponPurchaseResponse;
import com.mycard.api.dto.coupon.MyCouponResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "쿠폰", description = "e쿠폰 관리 API")
@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @Operation(summary = "e쿠폰 구매")
    @PostMapping("/purchase")
    public ResponseEntity<CouponPurchaseResponse> purchase(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CouponPurchaseRequest request) {
        CouponPurchaseResponse response = couponService.purchase(currentUser, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 쿠폰함 조회")
    @GetMapping("/my")
    public ResponseEntity<Page<MyCouponResponse>> getMyCoupons(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 20, sort = "purchasedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MyCouponResponse> response = couponService.getMyCoupons(currentUser, pageable);
        return ResponseEntity.ok(response);
    }
}
