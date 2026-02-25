package com.mycard.api.controller;

import com.mycard.api.dto.bank.BankAccountRequest;
import com.mycard.api.dto.bank.BankAccountResponse;
import com.mycard.api.dto.bank.BankCodeResponse;
import com.mycard.api.security.CurrentUser;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    /**
     * 사용 가능한 은행 목록 조회
     */
    @GetMapping("/banks")
    public ResponseEntity<List<BankCodeResponse>> getBankCodes() {
        return ResponseEntity.ok(bankAccountService.getBankCodes());
    }

    /**
     * 내 계좌 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BankAccountResponse>> getMyAccounts(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(bankAccountService.getAccounts(currentUser));
    }

    /**
     * 계좌 등록
     */
    @PostMapping
    public ResponseEntity<BankAccountResponse> addAccount(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody BankAccountRequest request) {
        return ResponseEntity.ok(bankAccountService.addAccount(currentUser, request));
    }

    /**
     * 계좌 삭제
     */
    @DeleteMapping("/{accountId}")
    public ResponseEntity<Void> deleteAccount(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable Long accountId) {
        bankAccountService.deleteAccount(currentUser, accountId);
        return ResponseEntity.ok().build();
    }

    /**
     * 기본 계좌 설정
     */
    @PutMapping("/{accountId}/default")
    public ResponseEntity<BankAccountResponse> setDefaultAccount(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable Long accountId) {
        return ResponseEntity.ok(bankAccountService.setDefaultAccount(currentUser, accountId));
    }
}
