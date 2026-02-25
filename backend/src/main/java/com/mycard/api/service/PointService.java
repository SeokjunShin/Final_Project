package com.mycard.api.service;

import com.mycard.api.dto.point.*;
import com.mycard.api.entity.*;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.*;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class PointService {

    private final PointBalanceRepository pointBalanceRepository;
    private final PointLedgerRepository pointLedgerRepository;
    private final PointWithdrawalRepository pointWithdrawalRepository;
    private final PointPolicyRepository pointPolicyRepository;
    private final UserRepository userRepository;
    private final UserBankAccountRepository bankAccountRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PointBalanceResponse getBalance(UserPrincipal currentUser) {
        PointBalance balance = pointBalanceRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> createInitialBalance(currentUser.getId()));

        return PointBalanceResponse.builder()
                .totalPoints(balance.getTotalPoints())
                .availablePoints(balance.getAvailablePoints())
                .expiringPoints(balance.getExpiringPoints())
                .expiringDate(balance.getExpiringDate())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<PointLedgerResponse> getLedger(UserPrincipal currentUser, Pageable pageable) {
        return pointLedgerRepository.findByUserId(currentUser.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PointLedgerResponse> getLedgerByType(UserPrincipal currentUser,
                                                      PointLedger.TransactionType type,
                                                      Pageable pageable) {
        return pointLedgerRepository.findByUserIdAndTransactionType(currentUser.getId(), type, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public PointWithdrawalResponse convertToMoney(UserPrincipal currentUser, PointConversionRequest request) {
        Long userId = currentUser.getId();

        // 출금 계좌 확인 (지정된 계좌 또는 기본 계좌)
        UserBankAccount account;
        if (request.getAccountId() != null) {
            account = bankAccountRepository.findByIdAndUserId(request.getAccountId(), userId)
                    .orElseThrow(() -> new BadRequestException("등록된 계좌를 찾을 수 없습니다."));
        } else {
            account = bankAccountRepository.findByUserIdAndIsDefaultTrue(userId)
                    .orElseThrow(() -> new BadRequestException("기본 출금 계좌가 설정되지 않았습니다. 계좌를 먼저 등록해주세요."));
        }

        // 계좌 인증 확인
        if (!account.getIsVerified()) {
            throw new BadRequestException("인증되지 않은 계좌입니다.");
        }

        // Get active policy
        PointPolicy policy = pointPolicyRepository.findFirstByEnabledTrueOrderByUpdatedAtDesc()
                .orElseThrow(() -> new BadRequestException("포인트 정책을 찾을 수 없습니다."));

        BigDecimal feeRate = policy.getFeeRate();
        BigDecimal dailyLimit = BigDecimal.valueOf(policy.getDailyWithdrawalLimitPoints());
        BigDecimal minPoints = BigDecimal.valueOf(policy.getMinWithdrawPoints());
        BigDecimal maxPoints = BigDecimal.valueOf(policy.getMaxWithdrawPoints());

        // Check minimum points
        if (request.getPoints().compareTo(minPoints) < 0) {
            throw new BadRequestException("최소 " + minPoints.intValue() + " 포인트부터 전환할 수 있습니다.");
        }

        // Check maximum points
        if (request.getPoints().compareTo(maxPoints) > 0) {
            throw new BadRequestException("1회 최대 " + maxPoints.intValue() + " 포인트까지 전환할 수 있습니다.");
        }

        // Check daily limit
        BigDecimal todayTotal = getTodayWithdrawalAmount(userId);
        BigDecimal cashAmount = calculateCashAmount(request.getPoints(), feeRate);
        if (todayTotal.add(request.getPoints()).compareTo(dailyLimit) > 0) {
            throw new BadRequestException("일일 전환 한도를 초과했습니다. (한도: " + dailyLimit.intValue() + "P)");
        }

        // Get point balance with lock (pessimistic)
        PointBalance balance = pointBalanceRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new BadRequestException("포인트 잔액 정보를 찾을 수 없습니다."));

        if (balance.getAvailablePoints().compareTo(request.getPoints()) < 0) {
            throw new BadRequestException("포인트 잔액이 부족합니다.");
        }

        // Deduct points
        balance.usePoints(request.getPoints());
        pointBalanceRepository.save(balance);

        // Calculate fee
        BigDecimal fee = request.getPoints().multiply(feeRate).setScale(0, RoundingMode.FLOOR);

        // Create withdrawal request
        User user = userRepository.getReferenceById(userId);
        PointWithdrawal withdrawal = new PointWithdrawal(user, request.getPoints(), cashAmount);
        withdrawal.setFeeAmount(fee);
        withdrawal.setBankName(account.getBankName());
        withdrawal.setAccountNumber(account.getAccountNumberMasked());
        withdrawal.setStatus(PointWithdrawal.WithdrawalStatus.REQUESTED);
        pointWithdrawalRepository.save(withdrawal);

        // Record point usage history
        PointLedger ledger = new PointLedger(user, PointLedger.TransactionType.CONVERT,
                request.getPoints().negate(), balance.getAvailablePoints(),
                "포인트 전환 (" + account.getBankName() + " " + account.getAccountNumberMasked() + ")");
        ledger.setReferenceType("PointWithdrawal");
        ledger.setReferenceId(withdrawal.getId());
        pointLedgerRepository.save(ledger);

        auditService.log(AuditLog.ActionType.CREATE, "PointWithdrawal", withdrawal.getId(),
                "포인트 전환 요청: " + request.getPoints() + "P -> " + cashAmount + "원 (" + account.getBankName() + ")");

        return toWithdrawalResponse(withdrawal);
    }

    @Transactional(readOnly = true)
    public Page<PointWithdrawalResponse> getWithdrawals(UserPrincipal currentUser, Pageable pageable) {
        return pointWithdrawalRepository.findByUserId(currentUser.getId(), pageable)
                .map(this::toWithdrawalResponse);
    }

    private PointBalance createInitialBalance(Long userId) {
        User user = userRepository.getReferenceById(userId);
        PointBalance balance = new PointBalance(user);
        return pointBalanceRepository.save(balance);
    }

    private BigDecimal getTodayWithdrawalAmount(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        return pointWithdrawalRepository.sumDailyWithdrawalAmount(userId, startOfDay);
    }

    private BigDecimal calculateCashAmount(BigDecimal points, BigDecimal feeRate) {
        BigDecimal fee = points.multiply(feeRate).setScale(0, RoundingMode.FLOOR);
        return points.subtract(fee);
    }

    private PointLedgerResponse toResponse(PointLedger ledger) {
        return PointLedgerResponse.builder()
                .id(ledger.getId())
                .transactionType(ledger.getTransactionType())
                .amount(ledger.getAmount())
                .balanceAfter(ledger.getBalanceAfter())
                .description(ledger.getDescription())
                .createdAt(ledger.getCreatedAt())
                .build();
    }

    private PointWithdrawalResponse toWithdrawalResponse(PointWithdrawal withdrawal) {
        return PointWithdrawalResponse.builder()
                .id(withdrawal.getId())
                .pointsAmount(withdrawal.getPointsAmount())
                .cashAmount(withdrawal.getCashAmount())
                .feeAmount(withdrawal.getFeeAmount())
                .bankName(withdrawal.getBankName())
                .accountNumber(withdrawal.getAccountNumber())
                .status(withdrawal.getStatus())
                .processedAt(withdrawal.getProcessedAt())
                .createdAt(withdrawal.getCreatedAt())
                .build();
    }
}
