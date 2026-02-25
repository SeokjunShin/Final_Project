package com.mycard.api.service;

import com.mycard.api.dto.loan.LoanCreateRequest;
import com.mycard.api.dto.loan.LoanDetailResponse;
import com.mycard.api.dto.loan.LoanListResponse;
import com.mycard.api.entity.Loan;
import com.mycard.api.entity.User;
import com.mycard.api.exception.AccessDeniedException;
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

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final OwnerCheckService ownerCheckService;

    @Transactional(readOnly = true)
    public Page<LoanListResponse> getMyLoans(UserPrincipal currentUser, Pageable pageable) {
        return loanRepository.findByUser_IdOrderByRequestedAtDesc(currentUser.getId(), pageable)
                .map(this::toListResponse);
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

    private LoanListResponse toListResponse(Loan loan) {
        return LoanListResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .principalAmount(loan.getPrincipalAmount())
                .status(loan.getStatus())
                .requestedAt(loan.getRequestedAt())
                .build();
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
