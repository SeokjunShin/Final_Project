package com.mycard.api.service;

import com.mycard.api.dto.bank.BankAccountRequest;
import com.mycard.api.dto.bank.BankAccountResponse;
import com.mycard.api.dto.bank.BankCodeResponse;
import com.mycard.api.dto.bank.BankAccountTransactionResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.BankCode;
import com.mycard.api.entity.BankAccountTransaction;
import com.mycard.api.entity.Card;
import com.mycard.api.entity.CardApplication;
import com.mycard.api.entity.User;
import com.mycard.api.entity.UserBankAccount;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.BankCodeRepository;
import com.mycard.api.repository.BankAccountTransactionRepository;
import com.mycard.api.repository.CardApplicationRepository;
import com.mycard.api.repository.CardRepository;
import com.mycard.api.repository.UserBankAccountRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankAccountService {

    private static final int MAX_ACCOUNTS_PER_USER = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserBankAccountRepository bankAccountRepository;
    private final BankCodeRepository bankCodeRepository;
    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final CardApplicationRepository cardApplicationRepository;
    private final BankAccountTransactionRepository bankAccountTransactionRepository;
    private final AuditService auditService;

    /**
     * 사용 가능한 은행 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BankCodeResponse> getBankCodes() {
        return bankCodeRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toBankCodeResponse)
                .toList();
    }

    /**
     * 사용자 계좌 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getAccounts(UserPrincipal currentUser) {
        return bankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 계좌 등록 (본인 명의 검증 포함)
     */
    @Transactional
    public BankAccountResponse addAccount(UserPrincipal currentUser, BankAccountRequest request) {
        Long userId = currentUser.getId();

        // 최대 계좌 수 체크
        long accountCount = bankAccountRepository.countByUserId(userId);
        if (accountCount >= MAX_ACCOUNTS_PER_USER) {
            throw new BadRequestException("최대 " + MAX_ACCOUNTS_PER_USER + "개의 계좌만 등록할 수 있습니다.");
        }

        // 은행 코드 검증
        BankCode bankCode = bankCodeRepository.findById(request.getBankCode())
                .orElseThrow(() -> new BadRequestException("유효하지 않은 은행 코드입니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        String accountHolder = user.getFullName();
        if (request.getAccountHolder() != null
                && !request.getAccountHolder().isBlank()
                && !user.getFullName().equals(request.getAccountHolder())) {
            throw new BadRequestException("본인 명의 계좌만 개설 가능합니다.");
        }

        String generatedAccountNumber = generateIssuedAccountNumber(request.getBankCode());

        UserBankAccount account = new UserBankAccount(
                user,
                request.getBankCode(),
                bankCode.getName(),
                generatedAccountNumber,
                accountHolder
        );

        // 첫 번째 계좌이거나 기본 계좌로 설정 요청 시
        if (accountCount == 0 || Boolean.TRUE.equals(request.getSetAsDefault())) {
            // 기존 기본 계좌 해제
            bankAccountRepository.clearDefaultExcept(userId, 0L);
            account.setAsDefault();
        }

        // 계좌 인증 (모의 - 즉시 인증 완료)
        // 실제 서비스에서는 오픈뱅킹 API를 통한 1원 이체 인증 등 구현
        account.verify();

        bankAccountRepository.save(account);

        auditService.log(AuditLog.ActionType.CREATE, "BankAccount", account.getId(),
                "계좌 개설: " + bankCode.getName() + " " + account.getAccountNumberMasked());

        log.info("Bank account issued: userId={}, bank={}, masked={}",
                userId, bankCode.getName(), account.getAccountNumberMasked());

        return toResponse(account);
    }

    /**
     * 계좌 삭제
     */
    @Transactional
    public void deleteAccount(UserPrincipal currentUser, Long accountId) {
        UserBankAccount account = bankAccountRepository.findByIdAndUserId(accountId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("계좌를 찾을 수 없습니다."));

        List<Card> linkedCards = cardRepository.findByUserIdAndBankAccount_Id(currentUser.getId(), accountId);
        List<CardApplication> linkedApplications = cardApplicationRepository.findByUserIdAndBankAccount_Id(currentUser.getId(), accountId);
        boolean hasLinkedProducts = !linkedCards.isEmpty() || !linkedApplications.isEmpty();

        UserBankAccount replacementAccount = bankAccountRepository
                .findByUserIdOrderByIsDefaultDescCreatedAtDesc(currentUser.getId())
                .stream()
                .filter(candidate -> !candidate.getId().equals(accountId))
                .findFirst()
                .orElse(null);

        if (hasLinkedProducts && replacementAccount == null) {
            throw new BadRequestException("이 계좌는 카드 결제계좌로 연결되어 있어 삭제할 수 없습니다. 다른 계좌를 먼저 개설한 뒤 다시 시도해주세요.");
        }

        if (hasLinkedProducts) {
            relinkCardsAndApplications(linkedCards, linkedApplications, replacementAccount, currentUser.getId());
        }

        boolean wasDefault = account.getIsDefault();
        String masked = account.getAccountNumberMasked();
        String bankName = account.getBankName();

        bankAccountRepository.delete(account);

        // 기본 계좌가 삭제된 경우, 다른 계좌를 기본으로 설정
        if (wasDefault && replacementAccount == null) {
            bankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(currentUser.getId())
                    .stream()
                    .findFirst()
                    .ifPresent(nextDefault -> {
                        nextDefault.setAsDefault();
                        bankAccountRepository.save(nextDefault);
                    });
        }

        auditService.log(AuditLog.ActionType.DELETE, "BankAccount", accountId,
                "계좌 삭제: " + bankName + " " + masked);

        log.info("Bank account deleted: userId={}, accountId={}", currentUser.getId(), accountId);
    }

    /**
     * 기본 계좌 설정
     */
    @Transactional
    public BankAccountResponse setDefaultAccount(UserPrincipal currentUser, Long accountId) {
        UserBankAccount account = bankAccountRepository.findByIdAndUserId(accountId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("계좌를 찾을 수 없습니다."));

        if (!account.getIsVerified()) {
            throw new BadRequestException("인증된 계좌만 기본 계좌로 설정할 수 있습니다.");
        }

        // 기존 기본 계좌 해제
        bankAccountRepository.clearDefaultExcept(currentUser.getId(), accountId);
        
        account.setAsDefault();
        bankAccountRepository.save(account);

        log.info("Default bank account set: userId={}, accountId={}", currentUser.getId(), accountId);

        return toResponse(account);
    }

    /**
     * 기본 출금 계좌 조회
     */
    @Transactional(readOnly = true)
    public UserBankAccount getDefaultAccount(Long userId) {
        return bankAccountRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElse(null);
    }

    /**
     * ID로 계좌 조회 (사용자 검증 포함)
     */
    @Transactional(readOnly = true)
    public UserBankAccount getAccountById(Long userId, Long accountId) {
        return bankAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("계좌를 찾을 수 없습니다."));
    }

    private BankAccountResponse toResponse(UserBankAccount account) {
        return BankAccountResponse.builder()
                .id(account.getId())
                .bankCode(account.getBankCode())
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())  // 실제 계좌번호 (취약점 진단용)
                .accountNumberMasked(account.getAccountNumberMasked())
                .accountHolder(account.getAccountHolder())
                .isVerified(account.getIsVerified())
                .isDefault(account.getIsDefault())
                .currentBalance(account.getCurrentBalance())
                .verifiedAt(account.getVerifiedAt())
                .createdAt(account.getCreatedAt())
                .recentTransactions(toTransactionResponses(account.getId()))
                .build();
    }

    private List<BankAccountTransactionResponse> toTransactionResponses(Long accountId) {
        if (accountId == null) {
            return Collections.emptyList();
        }
        return bankAccountTransactionRepository.findTop5ByBankAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    private BankAccountTransactionResponse toTransactionResponse(BankAccountTransaction transaction) {
        return BankAccountTransactionResponse.builder()
                .id(transaction.getId())
                .transactionType(transaction.getTransactionType())
                .amount(transaction.getAmount())
                .balanceAfter(transaction.getBalanceAfter())
                .description(transaction.getDescription())
                .relatedLoanId(transaction.getLoan() != null ? transaction.getLoan().getId() : null)
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private BankCodeResponse toBankCodeResponse(BankCode bankCode) {
        return BankCodeResponse.builder()
                .code(bankCode.getCode())
                .name(bankCode.getName())
                .build();
    }

    private String generateIssuedAccountNumber(String bankCode) {
        StringBuilder builder = new StringBuilder();
        builder.append(bankCode);
        builder.append(String.format("%03d", RANDOM.nextInt(1000)));
        while (builder.length() < 13) {
            builder.append(RANDOM.nextInt(10));
        }
        return builder.substring(0, 13);
    }

    private void relinkCardsAndApplications(
            List<Card> linkedCards,
            List<CardApplication> linkedApplications,
            UserBankAccount replacementAccount,
            Long userId) {
        bankAccountRepository.clearDefaultExcept(userId, replacementAccount.getId());
        replacementAccount.setAsDefault();
        bankAccountRepository.save(replacementAccount);

        for (Card card : linkedCards) {
            card.setBankAccount(replacementAccount);
            cardRepository.save(card);
        }

        for (CardApplication application : linkedApplications) {
            application.setBankAccount(replacementAccount);
            cardApplicationRepository.save(application);
        }
    }
}
