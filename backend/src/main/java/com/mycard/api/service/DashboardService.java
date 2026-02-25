package com.mycard.api.service;

import com.mycard.api.dto.dashboard.DashboardSummaryResponse;
import com.mycard.api.entity.Approval;
import com.mycard.api.entity.Card;
import com.mycard.api.entity.PointBalance;
import com.mycard.api.entity.Statement;
import com.mycard.api.repository.*;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CardRepository cardRepository;
    private final ApprovalRepository approvalRepository;
    private final StatementRepository statementRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(UserPrincipal currentUser) {
        Long userId = currentUser.getId();

        // 카드 정보
        List<Card> cards = cardRepository.findActiveCardsByUserId(userId);
        BigDecimal totalAvailableLimit = cards.stream()
                .map(Card::getAvailableLimit)
                .filter(limit -> limit != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 결제 예정액 (이번 달 청구서)
        BigDecimal upcomingPayment = calculateUpcomingPayment(userId);

        // 포인트 잔액
        BigDecimal pointBalance = pointBalanceRepository.findByUserId(userId)
                .map(PointBalance::getAvailablePoints)
                .orElse(BigDecimal.ZERO);

        // 최근 승인 5건
        List<Approval> recentApprovals = approvalRepository
                .findTop5ByUserIdOrderByApprovedAtDesc(userId, PageRequest.of(0, 5));

        // 읽지 않은 메시지 수
        long unreadMessageCount = messageRepository.countByUserIdAndIsReadFalse(userId);

        // 최근 6개월 월별 소비 집계
        List<DashboardSummaryResponse.MonthlySpend> monthlySpendList = getMonthlySpend(userId);

        return DashboardSummaryResponse.builder()
                .upcomingPayment(upcomingPayment)
                .totalAvailableLimit(totalAvailableLimit)
                .pointBalance(pointBalance)
                .cardCount(cards.size())
                .unreadMessageCount(unreadMessageCount)
                .recentApprovals(recentApprovals.stream()
                        .map(this::toApprovalSummary)
                        .toList())
                .monthlySpend(monthlySpendList)
                .build();
    }

    private List<DashboardSummaryResponse.MonthlySpend> getMonthlySpend(Long userId) {
        // 6개월 전부터 현재까지
        LocalDateTime sixMonthsAgo = LocalDate.now().minusMonths(5).withDayOfMonth(1).atStartOfDay();
        List<Approval> approvals = approvalRepository.findApprovedByUserIdSince(userId, sixMonthsAgo);

        // 월별로 그룹화하여 집계
        Map<YearMonth, BigDecimal> monthlyTotals = new LinkedHashMap<>();
        
        // 빈 월도 포함하기 위해 미리 초기화
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.now().minusMonths(i);
            monthlyTotals.put(ym, BigDecimal.ZERO);
        }

        // 승인 내역 집계
        for (Approval approval : approvals) {
            YearMonth ym = YearMonth.from(approval.getApprovedAt());
            if (monthlyTotals.containsKey(ym)) {
                monthlyTotals.merge(ym, approval.getAmount(), BigDecimal::add);
            }
        }

        // 응답 형식으로 변환
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M월");
        return monthlyTotals.entrySet().stream()
                .map(entry -> DashboardSummaryResponse.MonthlySpend.builder()
                        .month(entry.getKey().format(formatter))
                        .amount(entry.getValue())
                        .build())
                .toList();
    }

    private BigDecimal calculateUpcomingPayment(Long userId) {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        List<Card> cards = cardRepository.findByUserId(userId);
        BigDecimal total = BigDecimal.ZERO;

        for (Card card : cards) {
            Statement statement = statementRepository
                    .findByUserIdAndYearMonthAndCardId(userId, year, month, card.getId())
                    .orElse(null);
            if (statement != null && !statement.getPaid()) {
                total = total.add(statement.getTotalAmount());
            }
        }

        return total;
    }

    private DashboardSummaryResponse.ApprovalSummary toApprovalSummary(Approval approval) {
        return DashboardSummaryResponse.ApprovalSummary.builder()
                .id(approval.getId())
                .merchantName(approval.getMerchantName())
                .amount(approval.getAmount())
                .approvedAt(approval.getApprovedAt())
                .status(approval.getStatus().name())
                .cardMasked(approval.getCard().getMaskedCardNumber())
                .build();
    }
}
