package com.mycard.api.service;

import com.mycard.api.dto.loan.LoanCreateRequest;
import com.mycard.api.dto.loan.LoanDetailResponse;
import com.mycard.api.dto.loan.LoanListResponse;
import com.mycard.api.entity.Loan;
import com.mycard.api.entity.User;
import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.LoanRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
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

        BigDecimal interestRate = request.getInterestRate() != null ? request.getInterestRate() : BigDecimal.ZERO;

        Loan loan = new Loan(
                user,
                request.getLoanType(),
                request.getPrincipalAmount(),
                interestRate,
                request.getTermMonths()
        );
        loan = loanRepository.save(loan);

        return toDetailResponse(loan);
    }

    /**
     * 관리자용 대출 승인
     */
    @Transactional
    public LoanDetailResponse approveLoanAsAdmin(Long loanId) {
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (loan.getStatus() != Loan.LoanStatus.REQUESTED) {
            throw new BadRequestException("REQUESTED 상태의 대출만 승인할 수 있습니다.");
        }

        loan.setStatus(Loan.LoanStatus.APPROVED);
        loan.setApprovedAt(LocalDateTime.now());
        loanRepository.save(loan);

        return toDetailResponse(loan);
    }

    /**
     * 관리자용 대출 출금 처리
     */
    @Transactional
    public LoanDetailResponse disburseLoanAsAdmin(Long loanId) {
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (loan.getStatus() != Loan.LoanStatus.APPROVED) {
            throw new BadRequestException("APPROVED 상태의 대출만 출금 처리할 수 있습니다.");
        }

        loan.setStatus(Loan.LoanStatus.DISBURSED);
        loan.setDisbursedAt(LocalDateTime.now());
        loanRepository.save(loan);

        return toDetailResponse(loan);
    }

    /**
     * 관리자용 대출 취소(거절) 처리
     */
    @Transactional
    public LoanDetailResponse cancelLoanAsAdmin(Long loanId) {
        Loan loan = loanRepository.findByIdWithUser(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (loan.getStatus() == Loan.LoanStatus.REPAID || loan.getStatus() == Loan.LoanStatus.CANCELED) {
            throw new BadRequestException("이미 종료된 대출입니다.");
        }

        loan.setStatus(Loan.LoanStatus.CANCELED);
        loan.setCanceledAt(LocalDateTime.now());
        loanRepository.save(loan);

        return toDetailResponse(loan);
    }

    private LoanListResponse toListResponse(Loan loan, boolean includeUser) {
        LoanListResponse.LoanListResponseBuilder b = LoanListResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .principalAmount(loan.getPrincipalAmount())
                .status(loan.getStatus())
                .requestedAt(loan.getRequestedAt());
        if (includeUser && loan.getUser() != null) {
            b.userId(loan.getUser().getId()).userName(loan.getUser().getFullName());
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
                .approvedAt(loan.getApprovedAt())
                .disbursedAt(loan.getDisbursedAt())
                .repaidAt(loan.getRepaidAt())
                .canceledAt(loan.getCanceledAt())
                .build();
    }
}
