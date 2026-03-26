package com.mycard.api.service;

import com.mycard.api.dto.loan.LoanCreateRequest;
import com.mycard.api.dto.loan.LoanDetailResponse;
import com.mycard.api.dto.loan.LoanListResponse;
import com.mycard.api.entity.Card;
import com.mycard.api.entity.Loan;
import com.mycard.api.entity.Message;
import com.mycard.api.entity.User;
import com.mycard.api.entity.UserBankAccount;
import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.CardRepository;
import com.mycard.api.repository.LoanRepository;
import com.mycard.api.repository.MessageRepository;
import com.mycard.api.repository.UserBankAccountRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.util.MaskingUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final UserBankAccountRepository userBankAccountRepository;
    private final BankAccountLedgerService bankAccountLedgerService;
    private final MessageRepository messageRepository;
    private final OwnerCheckService ownerCheckService;

    @Transactional(readOnly = true)
    public Page<LoanListResponse> getMyLoans(UserPrincipal currentUser, Pageable pageable) {
        if (currentUser != null && ownerCheckService.isAdminOrOperator(currentUser)) {
            return loanRepository.findAllByOrderByRequestedAtDesc(pageable)
                    .map(loan -> toListResponse(loan, true));
        }
        return loanRepository.findByUser_IdOrderByRequestedAtDesc(currentUser.getId(), pageable)
                .map(loan -> toListResponse(loan, false));
    }

    @Transactional(readOnly = true)
    public LoanDetailResponse getLoan(Long loanId, UserPrincipal currentUser) {
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (!loan.isOwnedBy(currentUser.getId()) && !ownerCheckService.isAdminOrOperator(currentUser)) {
            throw new AccessDeniedException();
        }

        return toDetailResponse(loan);
    }

    @Transactional
    public LoanDetailResponse createLoan(UserPrincipal currentUser, LoanCreateRequest request) {
        User user = userRepository.getReferenceById(currentUser.getId());
        Card card = cardRepository.findByIdAndUserId(request.getCardId(), currentUser.getId())
                .orElseThrow(() -> new BadRequestException("선택한 카드를 찾을 수 없습니다."));
        if (card.getStatus() != Card.CardStatus.ACTIVE) {
            throw new BadRequestException("정상 상태의 카드만 대출 서비스에 연결할 수 있습니다.");
        }
        UserBankAccount depositAccount = resolveDepositAccount(currentUser.getId(), card, request.getBankAccountId());

        BigDecimal interestRate = request.getInterestRate() != null ? request.getInterestRate() : BigDecimal.ZERO;

        Loan loan = new Loan(
                user,
                card,
                depositAccount,
                request.getLoanType(),
                request.getPrincipalAmount(),
                interestRate,
                request.getTermMonths()
        );
        loan = loanRepository.save(loan);

        return toDetailResponse(loan);
    }

    /**
     * 관리자용 대출 승인 (DB에 직접 UPDATE 후 재조회하여 반영 보장)
     * REQUIRES_NEW: AdminController가 readOnly 트랜잭션이므로 쓰기용 새 트랜잭션에서 실행
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = false)
    public LoanDetailResponse approveLoanAsAdmin(Long loanId) {
        LocalDateTime now = LocalDateTime.now();
        int updated = loanRepository.approveById(loanId, now);
        if (updated == 0) {
            Loan loan = loanRepository.findByIdWithUser(loanId)
                    .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
            throw new BadRequestException("REQUESTED 상태의 대출만 승인할 수 있습니다. 현재: " + loan.getStatus());
        }
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
        return toDetailResponse(loan);
    }

    /**
     * 관리자용 대출 출금 처리 (DB에 직접 UPDATE 후 재조회)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = false)
    public LoanDetailResponse disburseLoanAsAdmin(Long loanId) {
        LocalDateTime now = LocalDateTime.now();
        int updated = loanRepository.disburseById(loanId, now);
        if (updated == 0) {
            Loan loan = loanRepository.findByIdWithUser(loanId)
                    .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
            throw new BadRequestException("APPROVED 상태의 대출만 출금 처리할 수 있습니다. 현재: " + loan.getStatus());
        }
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
        createLoanDisbursementTransaction(loan);
        sendDisbursementNotification(loan);
        return toDetailResponse(loan);
    }

    /**
     * 관리자용 대출 취소(거절) 처리 (DB에 직접 UPDATE 후 재조회)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = false)
    public LoanDetailResponse cancelLoanAsAdmin(Long loanId) {
        LocalDateTime now = LocalDateTime.now();
        int updated = loanRepository.cancelById(loanId, now);
        if (updated == 0) {
            Loan loan = loanRepository.findByIdWithUser(loanId)
                    .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
            if (loan.getStatus() == Loan.LoanStatus.REPAID || loan.getStatus() == Loan.LoanStatus.CANCELED) {
                throw new BadRequestException("이미 종료된 대출입니다.");
            }
            throw new BadRequestException("취소할 수 없는 상태입니다. 현재: " + loan.getStatus());
        }
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
        return toDetailResponse(loan);
    }

    private LoanListResponse toListResponse(Loan loan, boolean includeUser) {
        LoanListResponse.LoanListResponseBuilder b = LoanListResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .principalAmount(loan.getPrincipalAmount())
                .status(loan.getStatus())
                .requestedAt(loan.getRequestedAt())
                .cardId(loan.getCard() != null ? loan.getCard().getId() : null)
                .cardAlias(loan.getCard() != null ? loan.getCard().getCardAlias() : null)
                .cardNumberMasked(loan.getCard() != null ? MaskingUtils.maskCardNumber(loan.getCard().getCardNumber()) : null)
                .depositBankAccountId(loan.getBankAccount() != null ? loan.getBankAccount().getId() : null)
                .depositBankName(loan.getBankAccount() != null ? loan.getBankAccount().getBankName() : null)
                .depositAccountNumberMasked(loan.getBankAccount() != null ? loan.getBankAccount().getAccountNumberMasked() : null);
        if (includeUser && loan.getUser() != null) {
            b.userId(loan.getUser().getId()).userName(MaskingUtils.maskName(loan.getUser().getFullName()));
        }
        return b.build();
    }

    private LoanDetailResponse toDetailResponse(Loan loan) {
        return LoanDetailResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .principalAmount(loan.getPrincipalAmount())
                .interestRate(loan.getInterestRate())
                .termMonths(loan.getTermMonths())
                .status(loan.getStatus())
                .requestedAt(loan.getRequestedAt())
                .cardId(loan.getCard() != null ? loan.getCard().getId() : null)
                .cardAlias(loan.getCard() != null ? loan.getCard().getCardAlias() : null)
                .cardNumberMasked(loan.getCard() != null ? MaskingUtils.maskCardNumber(loan.getCard().getCardNumber()) : null)
                .depositBankAccountId(loan.getBankAccount() != null ? loan.getBankAccount().getId() : null)
                .depositBankName(loan.getBankAccount() != null ? loan.getBankAccount().getBankName() : null)
                .depositAccountNumberMasked(loan.getBankAccount() != null ? loan.getBankAccount().getAccountNumberMasked() : null)
                .approvedAt(loan.getApprovedAt())
                .disbursedAt(loan.getDisbursedAt())
                .repaidAt(loan.getRepaidAt())
                .canceledAt(loan.getCanceledAt())
                .build();
    }

    private UserBankAccount resolveDepositAccount(Long userId, Card card, Long requestedBankAccountId) {
        if (requestedBankAccountId != null) {
            return userBankAccountRepository.findByIdAndUserId(requestedBankAccountId, userId)
                    .orElseThrow(() -> new BadRequestException("선택한 입금 계좌를 찾을 수 없습니다."));
        }

        if (card.getBankAccount() != null) {
            return card.getBankAccount();
        }

        return userBankAccountRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new BadRequestException("입금받을 계좌를 선택해 주세요."));
    }



    private void createLoanDisbursementTransaction(Loan loan) {
        if (loan.getBankAccount() == null) {
            return;
        }
        String description = (loan.getLoanType() == Loan.LoanType.CARD_LOAN ? "카드대출" : "현금서비스")
                + " 입금";
        bankAccountLedgerService.deposit(loan.getBankAccount(), loan, loan.getPrincipalAmount(), description);
    }

    private void sendDisbursementNotification(Loan loan) {
        if (loan.getUser() == null || loan.getBankAccount() == null) {
            return;
        }
        User recipient = loan.getUser();
        User sender = userRepository.findById(1L).orElse(recipient);
        String loanLabel = loan.getLoanType() == Loan.LoanType.CARD_LOAN ? "카드대출" : "현금서비스";
        String content = "%s %s원이 %s %s 계좌로 입금되었습니다."
                .formatted(
                        loanLabel,
                        loan.getPrincipalAmount().toPlainString(),
                        loan.getBankAccount().getBankName(),
                        loan.getBankAccount().getAccountNumberMasked()
                );
        messageRepository.save(new Message(sender, recipient, Message.MessageType.SYSTEM, "대출금이 입금되었습니다.", content));
    }
}
