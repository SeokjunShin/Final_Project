package com.mycard.api.service;

import com.mycard.api.dto.CardApplicationRequest;
import com.mycard.api.dto.CardApplicationResponse;
import com.mycard.api.entity.Card;
import com.mycard.api.entity.CardApplication;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.CardApplicationRepository;
import com.mycard.api.repository.CardRepository;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CardApplicationService {
    
    private final CardApplicationRepository cardApplicationRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    
    /**
     * 카드 신청
     */
    @Transactional
    public CardApplicationResponse createApplication(Long userId, CardApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        
        // 이미 진행중인 신청이 있는지 확인
        List<CardApplication> pendingApps = cardApplicationRepository.findPendingByUser(user);
        if (!pendingApps.isEmpty()) {
            throw new BadRequestException("이미 진행중인 카드 신청이 있습니다. 기존 신청이 처리된 후 다시 시도해주세요.");
        }
        
        CardApplication application = new CardApplication();
        application.setUser(user);
        
        // 개인정보
        application.setFullName(request.getFullName());
        application.setSsn(request.getSsn()); // 자동으로 암호화됨
        application.setPhone(request.getPhone());
        application.setEmail(request.getEmail());
        application.setAddress(request.getAddress());
        application.setAddressDetail(request.getAddressDetail());
        
        // 직업/소득 정보
        application.setEmploymentType(CardApplication.EmploymentType.valueOf(request.getEmploymentType()));
        application.setEmployerName(request.getEmployerName());
        application.setJobTitle(request.getJobTitle());
        application.setAnnualIncome(request.getAnnualIncome()); // 자동으로 암호화됨
        
        // 신청 카드 정보
        application.setCardType(request.getCardType());
        application.setCardProduct(request.getCardProduct());
        application.setRequestedCreditLimit(request.getRequestedCreditLimit());
        application.setCardPassword(request.getCardPassword()); // 카드 비밀번호 (평문 저장)
        
        application.setStatus(CardApplication.ApplicationStatus.PENDING);
        
        CardApplication saved = cardApplicationRepository.save(application);
        log.info("카드 신청 생성 - ID: {}, 사용자: {}", saved.getId(), user.getEmail());
        
        return toResponse(saved);
    }
    
    /**
     * 사용자 본인의 신청 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CardApplicationResponse> getMyApplications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        
        return cardApplicationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 사용자 본인의 신청 상세 조회
     */
    @Transactional(readOnly = true)
    public CardApplicationResponse getMyApplication(Long userId, Long applicationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        
        CardApplication application = cardApplicationRepository.findByIdAndUser(applicationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
        
        return toResponse(application);
    }
    
    /**
     * 신청 취소 (대기중 상태일 때만 가능)
     */
    @Transactional
    public void cancelApplication(Long userId, Long applicationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        
        CardApplication application = cardApplicationRepository.findByIdAndUser(applicationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
        
        if (application.getStatus() != CardApplication.ApplicationStatus.PENDING) {
            throw new BadRequestException("대기중 상태의 신청만 취소할 수 있습니다.");
        }
        
        cardApplicationRepository.delete(application);
        log.info("카드 신청 취소 - ID: {}, 사용자: {}", applicationId, user.getEmail());
    }
    
    // ==================== Admin Methods ====================
    
    /**
     * [Admin] 전체 신청 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<CardApplicationResponse> getAllApplications(Pageable pageable) {
        return cardApplicationRepository.findAllForAdmin(pageable)
                .map(this::toAdminResponse);
    }
    
    /**
     * [Admin] 상태별 신청 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<CardApplicationResponse> getApplicationsByStatus(String status, Pageable pageable) {
        CardApplication.ApplicationStatus appStatus = CardApplication.ApplicationStatus.valueOf(status.toUpperCase());
        return cardApplicationRepository.findByStatusOrderByCreatedAtDesc(appStatus, pageable)
                .map(this::toAdminResponse);
    }
    
    /**
     * [Admin] 신청 상세 조회 (민감정보 포함)
     */
    @Transactional(readOnly = true)
    public CardApplicationResponse getApplicationDetail(Long applicationId) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
        
        return toAdminResponse(application);
    }
    
    /**
     * [Admin] 신청 승인
     */
    @Transactional
    public CardApplicationResponse approveApplication(Long applicationId, Long adminId, BigDecimal approvedLimit) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
        
        if (!application.isPending()) {
            throw new BadRequestException("대기중 또는 심사중 상태의 신청만 승인할 수 있습니다.");
        }
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("관리자를 찾을 수 없습니다."));
        
        // 만원 단위를 원 단위로 변환 (카드 한도는 원 단위로 저장)
        BigDecimal creditLimitInWon = approvedLimit.multiply(BigDecimal.valueOf(10000));
        
        // 카드 발급
        Card newCard = createCardFromApplication(application, creditLimitInWon);
        Card savedCard = cardRepository.save(newCard);
        
        // 신청 상태 업데이트
        application.setStatus(CardApplication.ApplicationStatus.APPROVED);
        application.setReviewedBy(admin);
        application.setReviewedAt(LocalDateTime.now());
        application.setApprovedCreditLimit(approvedLimit);
        application.setIssuedCard(savedCard);
        
        CardApplication saved = cardApplicationRepository.save(application);
        log.info("카드 신청 승인 - ID: {}, 관리자: {}, 발급카드: {}", applicationId, admin.getEmail(), savedCard.getId());
        
        return toAdminResponse(saved);
    }
    
    /**
     * [Admin] 신청 거절
     */
    @Transactional
    public CardApplicationResponse rejectApplication(Long applicationId, Long adminId, String reason) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
        
        if (!application.isPending()) {
            throw new BadRequestException("대기중 또는 심사중 상태의 신청만 거절할 수 있습니다.");
        }
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("관리자를 찾을 수 없습니다."));
        
        application.setStatus(CardApplication.ApplicationStatus.REJECTED);
        application.setReviewedBy(admin);
        application.setReviewedAt(LocalDateTime.now());
        application.setRejectionReason(reason);
        
        CardApplication saved = cardApplicationRepository.save(application);
        log.info("카드 신청 거절 - ID: {}, 관리자: {}, 사유: {}", applicationId, admin.getEmail(), reason);
        
        return toAdminResponse(saved);
    }
    
    /**
     * [Admin] 심사중 상태로 변경
     */
    @Transactional
    public CardApplicationResponse startReview(Long applicationId, Long adminId) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
        
        if (application.getStatus() != CardApplication.ApplicationStatus.PENDING) {
            throw new BadRequestException("대기중 상태의 신청만 심사를 시작할 수 있습니다.");
        }
        
        application.setStatus(CardApplication.ApplicationStatus.REVIEWING);
        
        CardApplication saved = cardApplicationRepository.save(application);
        log.info("카드 신청 심사 시작 - ID: {}", applicationId);
        
        return toAdminResponse(saved);
    }
    
    /**
     * 대기중 신청 건수
     */
    public long getPendingCount() {
        return cardApplicationRepository.countByStatus(CardApplication.ApplicationStatus.PENDING);
    }
    
    // ==================== Helper Methods ====================
    
    private Card createCardFromApplication(CardApplication application, BigDecimal creditLimit) {
        Card card = new Card();
        card.setUser(application.getUser());
        
        // 실제 16자리 카드 번호 생성 (취약점 진단용 - 평문 저장)
        String cardNumber = generateFullCardNumber(application.getCardType());
        String last4 = cardNumber.substring(cardNumber.length() - 4);
        
        card.setCardNumber(cardNumber);
        card.setLast4(last4);
        card.setCardAlias(application.getCardProduct());
        card.setCardType(application.getCardType());
        card.setExpiryDate(LocalDate.now().plusYears(5)); // 5년 유효기간
        card.setCreditLimit(creditLimit);
        card.setAvailableLimit(creditLimit);
        card.setStatus(Card.CardStatus.ACTIVE);
        card.setOverseasPaymentEnabled(false);
        card.setCardPassword(application.getCardPassword()); // 카드 비밀번호 복사 (평문)
        
        return card;
    }

    /**
     * 실제 16자리 카드번호 생성 (취약점 진단용)
     */
    private String generateFullCardNumber(String cardType) {
        java.util.Random rand = new java.util.Random();
        String prefix;
        
        // 카드 종류별 BIN (Bank Identification Number)
        switch (cardType) {
            case "VISA":
                prefix = "4" + String.format("%03d", rand.nextInt(1000)); // 4XXX
                break;
            case "MASTERCARD":
                prefix = "5" + (1 + rand.nextInt(5)) + String.format("%02d", rand.nextInt(100)); // 51XX-55XX
                break;
            default: // LOCAL
                prefix = "9" + String.format("%03d", rand.nextInt(1000)); // 9XXX (국내전용)
        }
        
        // 나머지 12자리 생성
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < 12; i++) {
            sb.append(rand.nextInt(10));
        }
        
        String raw = sb.toString();
        // 포맷: XXXX-XXXX-XXXX-XXXX
        return raw.substring(0, 4) + "-" + raw.substring(4, 8) + "-" + 
               raw.substring(8, 12) + "-" + raw.substring(12, 16);
    }
    
    private CardApplicationResponse toResponse(CardApplication app) {
        CardApplicationResponse response = new CardApplicationResponse();
        response.setId(app.getId());
        response.setFullName(app.getFullName());
        response.setMaskedSsn(app.getMaskedSsn()); // 마스킹된 주민번호
        response.setPhone(app.getPhone());
        response.setEmail(app.getEmail());
        response.setAddress(app.getAddress());
        response.setAddressDetail(app.getAddressDetail());
        response.setEmploymentType(app.getEmploymentType().name());
        response.setEmployerName(app.getEmployerName());
        response.setJobTitle(app.getJobTitle());
        response.setAnnualIncome(null); // 일반 조회시 연소득 숨김
        response.setCardType(app.getCardType());
        response.setCardProduct(app.getCardProduct());
        response.setRequestedCreditLimit(app.getRequestedCreditLimit());
        response.setStatus(app.getStatus().name());
        response.setReviewedAt(app.getReviewedAt());
        response.setRejectionReason(app.getRejectionReason());
        response.setApprovedCreditLimit(app.getApprovedCreditLimit());
        response.setCreatedAt(app.getCreatedAt());
        response.setUpdatedAt(app.getUpdatedAt());
        
        return response;
    }
    
    private CardApplicationResponse toAdminResponse(CardApplication app) {
        CardApplicationResponse response = toResponse(app);
        // 관리자는 연소득 확인 가능
        response.setAnnualIncome(app.getAnnualIncome());
        response.setAdminNotes(app.getAdminNotes());
        
        if (app.getUser() != null) {
            response.setUserName(app.getUser().getFullName());
            response.setUserEmail(app.getUser().getEmail());
        }
        
        if (app.getReviewedBy() != null) {
            response.setReviewerName(app.getReviewedBy().getFullName());
        }
        
        if (app.getIssuedCard() != null) {
            response.setIssuedCardId(app.getIssuedCard().getId());
            response.setIssuedCardNumber(app.getIssuedCard().getMaskedCardNumber());
        }
        
        return response;
    }
}
