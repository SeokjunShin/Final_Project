package com.mycard.api.service;

import com.mycard.api.dto.CardApplicationDocumentResponse;
import com.mycard.api.dto.CardApplicationRequest;
import com.mycard.api.dto.CardApplicationResponse;
import com.mycard.api.entity.Attachment;
import com.mycard.api.entity.Card;
import com.mycard.api.entity.CardApplication;
import com.mycard.api.entity.Document;
import com.mycard.api.entity.Message;
import com.mycard.api.entity.User;
import com.mycard.api.entity.UserBankAccount;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.AttachmentRepository;
import com.mycard.api.repository.CardApplicationRepository;
import com.mycard.api.repository.CardRepository;
import com.mycard.api.repository.DocumentRepository;
import com.mycard.api.repository.MessageRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.util.MaskingUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CardApplicationService {

    private static final String DEFAULT_PRIVACY_POLICY_VERSION = "2026-03";

    private final CardApplicationRepository cardApplicationRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final BankAccountService bankAccountService;
    private final DocumentRepository documentRepository;
    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final UploadValidationService uploadValidationService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.base-path:uploads}")
    private String uploadDir;

    /**
     * 카드 신청
     */
    @Transactional
    public CardApplicationResponse createApplication(Long userId, CardApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        List<CardApplication> pendingApps = cardApplicationRepository.findPendingByUser(user);
        if (!pendingApps.isEmpty()) {
            throw new BadRequestException("이미 진행중인 카드 신청이 있습니다. 기존 신청이 처리된 후 다시 시도해주세요.");
        }
        if (!Boolean.TRUE.equals(request.getAgreedToPrivacyPolicy())) {
            throw new BadRequestException("개인정보 처리 방침에 동의해야 카드 신청이 가능합니다.");
        }
        validateDomesticPersonalInfo(request);
        if (isSimpleCardPassword(request.getCardPassword())) {
            throw new BadRequestException("반복되거나 연속된 쉬운 카드 비밀번호는 사용할 수 없습니다.");
        }

        CardApplication application = new CardApplication();
        application.setUser(user);
        application.setFullName(request.getFullName());
        application.setSsn(request.getSsn());
        application.setPhone(request.getPhone());
        application.setEmail(request.getEmail());
        application.setAddress(request.getAddress());
        application.setAddressDetail(request.getAddressDetail());
        application.setEmploymentType(CardApplication.EmploymentType.valueOf(request.getEmploymentType()));
        application.setEmployerName(request.getEmployerName());
        application.setJobTitle(request.getJobTitle());
        application.setAnnualIncome(request.getAnnualIncome());
        application.setCardType(request.getCardType());
        application.setCardProduct(request.getCardProduct());
        application.setRequestedCreditLimit(request.getRequestedCreditLimit());
        application.setCardPassword(request.getCardPassword());
        application.setStatus(CardApplication.ApplicationStatus.PENDING);
        application.setPrivacyConsented(true);
        application.setPrivacyConsentedAt(LocalDateTime.now());
        application.setPrivacyPolicyVersion(
                request.getPrivacyPolicyVersion() != null && !request.getPrivacyPolicyVersion().isBlank()
                        ? request.getPrivacyPolicyVersion()
                        : DEFAULT_PRIVACY_POLICY_VERSION);

        if (request.getBankAccountId() != null) {
            UserBankAccount bankAccount = bankAccountService.getAccountById(userId, request.getBankAccountId());
            application.setBankAccount(bankAccount);
        }

        CardApplication saved = cardApplicationRepository.save(application);
        sendUserNotification(user,
                "카드 신청이 접수되었습니다.",
                getApplicationDisplayName(saved) + " 카드 신청이 접수되었습니다. 증빙 서류가 필요하다면 신청 상세에서 업로드해 주세요.");

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
     * 카드 신청 증빙 서류 업로드
     */
    @Transactional
    public CardApplicationDocumentResponse uploadEvidenceDocument(
            Long userId,
            Long applicationId,
            String docType,
            MultipartFile file) {
        CardApplication application = getOwnedApplication(userId, applicationId);
        if (application.getStatus() == CardApplication.ApplicationStatus.APPROVED) {
            throw new BadRequestException("승인 완료된 신청에는 증빙 서류를 추가할 수 없습니다.");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("업로드할 파일을 선택해주세요.");
        }
        uploadValidationService.validateDefaultUpload(file);

        Document document = new Document();
        document.setUser(application.getUser());
        document.setCardApplication(application);
        document.setStatus(Document.DocumentStatus.SUBMITTED);
        try {
            document.setDocumentType(Document.DocumentType.valueOf(docType.toUpperCase()));
        } catch (Exception e) {
            document.setDocumentType(Document.DocumentType.OTHER);
        }
        document = documentRepository.save(document);

        Attachment attachment = storeAttachment(file, application.getUser(), document);
        sendUserNotification(application.getUser(),
                "증빙 서류가 접수되었습니다.",
                getApplicationDisplayName(application) + " 카드 신청에 대한 증빙 서류가 접수되었습니다.");

        log.info("카드 신청 증빙 서류 업로드 - appId={}, docId={}, file={}",
                applicationId, document.getId(), attachment.getOriginalFilename());
        return toDocumentResponse(document, attachment);
    }

    /**
     * 카드 신청 증빙 서류 삭제
     */
    @Transactional
    public void deleteEvidenceDocument(Long userId, Long applicationId, Long documentId) {
        CardApplication application = getOwnedApplication(userId, applicationId);
        if (application.getStatus() == CardApplication.ApplicationStatus.APPROVED) {
            throw new BadRequestException("승인 완료된 신청의 증빙 서류는 삭제할 수 없습니다.");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("증빙 서류를 찾을 수 없습니다."));
        if (document.getCardApplication() == null || !document.getCardApplication().getId().equals(applicationId)) {
            throw new ResourceNotFoundException("증빙 서류를 찾을 수 없습니다.");
        }

        deleteDocumentFiles(document);
        documentRepository.delete(document);
        log.info("카드 신청 증빙 서류 삭제 - appId={}, docId={}", applicationId, documentId);
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

        documentRepository.findByCardApplicationIdOrderByCreatedAtDesc(applicationId)
                .forEach(this::deleteDocumentFiles);
        documentRepository.findByCardApplicationIdOrderByCreatedAtDesc(applicationId)
                .forEach(documentRepository::delete);

        cardApplicationRepository.delete(application);
        log.info("카드 신청 취소 - ID: {}, 사용자: {}", applicationId, user.getEmail());
    }

    // ==================== Admin Methods ====================

    @Transactional(readOnly = true)
    public Page<CardApplicationResponse> getAllApplications(Pageable pageable) {
        return cardApplicationRepository.findAllForAdmin(pageable)
                .map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public Page<CardApplicationResponse> getApplicationsByStatus(String status, Pageable pageable) {
        CardApplication.ApplicationStatus appStatus = CardApplication.ApplicationStatus.valueOf(status.toUpperCase());
        return cardApplicationRepository.findByStatusOrderByCreatedAtDesc(appStatus, pageable)
                .map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public CardApplicationResponse getApplicationDetail(Long applicationId) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));

        return toAdminResponse(application);
    }

    @Transactional
    public CardApplicationResponse approveApplication(Long applicationId, Long adminId, BigDecimal approvedLimit, String secondaryPassword) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));

        if (!application.isPending()) {
            throw new BadRequestException("대기중 또는 심사중 상태의 신청만 승인할 수 있습니다.");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("관리자를 찾을 수 없습니다."));

        if (admin.getSecondaryPassword() == null || admin.getSecondaryPassword().isBlank()) {
            throw new BadRequestException("2차 비밀번호가 설정되어 있지 않습니다.");
        }
        if (!passwordEncoder.matches(secondaryPassword, admin.getSecondaryPassword())) {
            throw new BadRequestException("2차 비밀번호가 일치하지 않습니다.");
        }

        BigDecimal creditLimitInWon = approvedLimit.multiply(BigDecimal.valueOf(10000));
        Card newCard = createCardFromApplication(application, creditLimitInWon);
        Card savedCard = cardRepository.save(newCard);

        application.setStatus(CardApplication.ApplicationStatus.APPROVED);
        application.setReviewedBy(admin);
        application.setReviewedAt(LocalDateTime.now());
        application.setApprovedCreditLimit(approvedLimit);
        application.setIssuedCard(savedCard);
        application.setRetentionUntil(LocalDateTime.now().plusYears(5));

        updateLinkedDocumentsStatus(application.getId(), Document.DocumentStatus.APPROVED, null, admin);

        CardApplication saved = cardApplicationRepository.save(application);
        sendUserNotification(application.getUser(),
                "카드 신청이 승인되었습니다.",
                getApplicationDisplayName(application) + " 카드 신청이 승인되었습니다.");

        log.info("카드 신청 승인 - ID: {}, 관리자: {}, 발급카드: {}", applicationId, admin.getEmail(), savedCard.getId());
        return toAdminResponse(saved);
    }

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
        application.setRetentionUntil(LocalDateTime.now().plusMonths(1));

        updateLinkedDocumentsStatus(application.getId(), Document.DocumentStatus.REJECTED, reason, admin);

        CardApplication saved = cardApplicationRepository.save(application);
        sendUserNotification(application.getUser(),
                "카드 신청이 반려되었습니다.",
                getApplicationDisplayName(application) + " 카드 신청이 반려되었습니다. 사유: " + reason);

        log.info("카드 신청 거절 - ID: {}, 관리자: {}, 사유: {}", applicationId, admin.getEmail(), reason);
        return toAdminResponse(saved);
    }

    @Transactional
    public CardApplicationResponse startReview(Long applicationId, Long adminId) {
        CardApplication application = cardApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));

        if (application.getStatus() != CardApplication.ApplicationStatus.PENDING) {
            throw new BadRequestException("대기중 상태의 신청만 심사를 시작할 수 있습니다.");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("관리자를 찾을 수 없습니다."));

        application.setStatus(CardApplication.ApplicationStatus.REVIEWING);
        updateLinkedDocumentsStatus(application.getId(), Document.DocumentStatus.UNDER_REVIEW, null, admin);

        CardApplication saved = cardApplicationRepository.save(application);
        log.info("카드 신청 심사 시작 - ID: {}", applicationId);
        return toAdminResponse(saved);
    }

    public long getPendingCount() {
        return cardApplicationRepository.countByStatus(CardApplication.ApplicationStatus.PENDING);
    }

    // ==================== Helper Methods ====================

    private CardApplication getOwnedApplication(Long userId, Long applicationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return cardApplicationRepository.findByIdAndUser(applicationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("신청 정보를 찾을 수 없습니다."));
    }

    private Attachment storeAttachment(MultipartFile file, User user, Document document) {
        String originalFilename = uploadValidationService.validateDefaultUpload(file);
        String storedFilename = UUID.randomUUID() + "_" + originalFilename;
        Path uploadPath = Paths.get(uploadDir);
        Path targetPath = uploadPath.resolve(storedFilename);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("파일 저장에 실패했습니다.");
        }

        Attachment attachment = new Attachment(
                user,
                originalFilename,
                storedFilename,
                targetPath.toString(),
                file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                file.getSize());
        attachment.setDocument(document);
        return attachmentRepository.save(attachment);
    }

    private void deleteDocumentFiles(Document document) {
        List<Attachment> attachments = attachmentRepository.findByDocumentId(document.getId());
        for (Attachment attachment : attachments) {
            try {
                Files.deleteIfExists(Paths.get(attachment.getFilePath()));
            } catch (IOException e) {
                log.warn("증빙 파일 삭제 실패: {}", attachment.getFilePath(), e);
            }
            attachmentRepository.delete(attachment);
        }
    }

    private void updateLinkedDocumentsStatus(
            Long applicationId,
            Document.DocumentStatus status,
            String reason,
            User reviewer) {
        List<Document> documents = documentRepository.findByCardApplicationIdOrderByCreatedAtDesc(applicationId);
        for (Document document : documents) {
            document.setStatus(status);
            document.setReviewedBy(reviewer);
            document.setReviewedAt(LocalDateTime.now());
            document.setReviewComment(reason);
            documentRepository.save(document);
        }
    }

    private void sendUserNotification(User recipient, String title, String content) {
        User sender = userRepository.findById(1L).orElse(recipient);
        messageRepository.save(new Message(sender, recipient, Message.MessageType.SYSTEM, title, content));
    }

    private void validateDomesticPersonalInfo(CardApplicationRequest request) {
        String normalizedSsn = request.getSsn() != null ? request.getSsn().replaceAll("\\D", "") : "";
        if (!isValidKoreanResidentNumber(normalizedSsn)) {
            throw new BadRequestException("유효한 주민등록번호를 입력해주세요.");
        }
    }

    private boolean isValidKoreanResidentNumber(String value) {
        if (!value.matches("^\\d{13}$")) {
            return false;
        }

        char backFirst = value.charAt(6);
        if (backFirst < '1' || backFirst > '4') {
            return false;
        }

        String yearPrefix = (backFirst == '1' || backFirst == '2') ? "19" : "20";
        String birthDateText = yearPrefix + value.substring(0, 6);
        try {
            LocalDate.parse(birthDateText, DateTimeFormatter.ofPattern("yyyyMMdd"));
        } catch (DateTimeParseException e) {
            return false;
        }

        int[] weights = {2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5};
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += Character.getNumericValue(value.charAt(i)) * weights[i];
        }

        int checkDigit = (11 - (sum % 11)) % 10;
        return checkDigit == Character.getNumericValue(value.charAt(12));
    }

    private String getApplicationDisplayName(CardApplication application) {
        if (application.getCardProduct() != null && !application.getCardProduct().isBlank()) {
            return application.getCardProduct().trim();
        }
        if (application.getCardType() != null && !application.getCardType().isBlank()) {
            return application.getCardType().trim();
        }
        return "MyCard";
    }

    private Card createCardFromApplication(CardApplication application, BigDecimal creditLimit) {
        Card card = new Card();
        card.setUser(application.getUser());

        String cardNumber = generateFullCardNumber(application.getCardType());
        String last4 = cardNumber.substring(cardNumber.length() - 4);

        card.setCardNumber(cardNumber);
        card.setLast4(last4);
        card.setCardAlias(application.getCardProduct());
        card.setCardType(application.getCardType());
        card.setExpiryDate(LocalDate.now().plusYears(5));
        card.setCreditLimit(creditLimit);
        card.setAvailableLimit(creditLimit);
        card.setStatus(Card.CardStatus.ACTIVE);
        card.setOverseasPaymentEnabled(false);
        card.setCardPassword(application.getCardPassword());
        card.setBankAccount(application.getBankAccount());

        return card;
    }

    private String generateFullCardNumber(String cardType) {
        java.util.Random rand = new java.util.Random();
        String prefix;

        switch (cardType) {
            case "VISA":
                prefix = "4" + String.format("%03d", rand.nextInt(1000));
                break;
            case "MASTERCARD":
                prefix = "5" + (1 + rand.nextInt(5)) + String.format("%02d", rand.nextInt(100));
                break;
            default:
                prefix = "9" + String.format("%03d", rand.nextInt(1000));
        }

        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < 12; i++) {
            sb.append(rand.nextInt(10));
        }

        String raw = sb.toString();
        return raw.substring(0, 4) + "-" + raw.substring(4, 8) + "-" +
                raw.substring(8, 12) + "-" + raw.substring(12, 16);
    }

    private boolean isSimpleCardPassword(String value) {
        if (value == null || !value.matches("^\\d{4,6}$")) {
            return false;
        }

        if (value.matches("^(\\d)\\1+$")) {
            return true;
        }

        boolean ascending = true;
        boolean descending = true;
        for (int i = 1; i < value.length(); i++) {
            int current = value.charAt(i) - '0';
            int previous = value.charAt(i - 1) - '0';
            if (current != previous + 1) {
                ascending = false;
            }
            if (current != previous - 1) {
                descending = false;
            }
        }
        if (ascending || descending) {
            return true;
        }

        if (value.length() % 2 == 0) {
            String pair = value.substring(0, 2);
            if (pair.repeat(value.length() / 2).equals(value)) {
                return true;
            }
        }

        return false;
    }

    private CardApplicationResponse toResponse(CardApplication app) {
        CardApplicationResponse response = new CardApplicationResponse();
        response.setId(app.getId());
        response.setFullName(MaskingUtils.maskName(app.getFullName()));
        response.setMaskedSsn(app.getMaskedSsn());
        response.setPhone(MaskingUtils.maskPhone(app.getPhone()));
        response.setEmail(MaskingUtils.maskEmail(app.getEmail()));
        response.setAddress(app.getAddress());
        response.setAddressDetail(MaskingUtils.maskAddressDetail(app.getAddressDetail()));
        response.setEmploymentType(app.getEmploymentType().name());
        response.setEmployerName(app.getEmployerName());
        response.setJobTitle(app.getJobTitle());
        response.setAnnualIncome(null);
        response.setCardType(app.getCardType());
        response.setCardProduct(app.getCardProduct());
        response.setRequestedCreditLimit(app.getRequestedCreditLimit());
        response.setStatus(app.getStatus().name());
        response.setReviewedAt(app.getReviewedAt());
        response.setRejectionReason(app.getRejectionReason());
        response.setApprovedCreditLimit(app.getApprovedCreditLimit());
        response.setCreatedAt(app.getCreatedAt());
        response.setUpdatedAt(app.getUpdatedAt());
        response.setPrivacyConsented(app.getPrivacyConsented());
        response.setPrivacyConsentedAt(app.getPrivacyConsentedAt());
        response.setPrivacyPolicyVersion(app.getPrivacyPolicyVersion());
        response.setRetentionUntil(app.getRetentionUntil());

        if (app.getBankAccount() != null) {
            response.setLinkedBankAccountId(app.getBankAccount().getId());
            response.setLinkedBankName(app.getBankAccount().getBankName());
            response.setLinkedAccountNumberMasked(app.getBankAccount().getAccountNumberMasked());
        }

        response.setEvidenceDocuments(documentRepository.findByCardApplicationIdOrderByCreatedAtDesc(app.getId())
                .stream()
                .map(this::toDocumentResponse)
                .toList());

        return response;
    }

    private CardApplicationResponse toAdminResponse(CardApplication app) {
        CardApplicationResponse response = toResponse(app);
        response.setAnnualIncome(app.getAnnualIncome());
        response.setAdminNotes(app.getAdminNotes());

        if (app.getUser() != null) {
            response.setUserName(MaskingUtils.maskName(app.getUser().getFullName()));
            response.setUserEmail(MaskingUtils.maskEmail(app.getUser().getEmail()));
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

    private CardApplicationDocumentResponse toDocumentResponse(Document document) {
        Attachment attachment = attachmentRepository.findFirstByDocumentId(document.getId()).orElse(null);
        return toDocumentResponse(document, attachment);
    }

    private CardApplicationDocumentResponse toDocumentResponse(Document document, Attachment attachment) {
        return CardApplicationDocumentResponse.builder()
                .id(document.getId())
                .attachmentId(attachment != null ? attachment.getId() : null)
                .docType(document.getDocumentType() != null ? document.getDocumentType().name() : "OTHER")
                .fileName(attachment != null ? attachment.getOriginalFilename() : null)
                .status(document.getStatus().name())
                .rejectionReason(document.getReviewComment())
                .submittedAt(document.getCreatedAt())
                .build();
    }
}
