package com.mycard.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String PURPOSE_SECOND_PASSWORD = "SECOND_PASSWORD";
    private static final String PURPOSE_LOGIN_PASSWORD = "LOGIN_PASSWORD";

    private final JavaMailSender emailSender;

    // 이메일 - (인증코드, 만료시간)을 임시 저장 (운영 환경에서는 Redis 권장)
    private final Map<String, VerificationInfo> verificationCodes = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private static class VerificationInfo {
        String code;
        LocalDateTime expiryTime;

        VerificationInfo(String code, LocalDateTime expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }
    }

    public void sendResetCode(String toEmail) {
        sendCode(toEmail, PURPOSE_SECOND_PASSWORD, "MyCard - 2차 비밀번호 재설정 인증코드");
    }

    public void sendLoginPasswordResetCode(String toEmail) {
        sendCode(toEmail, PURPOSE_LOGIN_PASSWORD, "MyCard - 로그인 비밀번호 재설정 인증코드");
    }

    public boolean verifyCode(String email, String inputCode) {
        return verifyCode(email, inputCode, PURPOSE_SECOND_PASSWORD);
    }

    public boolean verifyLoginPasswordResetCode(String email, String inputCode) {
        return verifyCode(email, inputCode, PURPOSE_LOGIN_PASSWORD);
    }

    public boolean checkLoginPasswordResetCode(String email, String inputCode) {
        return checkCode(email, inputCode, PURPOSE_LOGIN_PASSWORD);
    }

    private void sendCode(String toEmail, String purpose, String subject) {
        String code = generateCode();

        // 유효시간 5분 설정
        verificationCodes.put(buildKey(toEmail, purpose), new VerificationInfo(code, LocalDateTime.now().plusMinutes(5)));

        log.info("==========================================================");
        log.info("[EmailService] 2차 비밀번호 재설정 인증코드 요청 수신");
        log.info("수신자 이메일: {}", toEmail);
        log.info("발급된 인증코드: {}", code);
        log.info("==========================================================");

        // 로컬 테스트 편의를 위해 파일에도 저장합니다
        writeMockEmailToFile(toEmail, code);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText("안녕하세요. MyCard 입니다.\n\n" +
                    "요청하신 인증코드는 다음과 같습니다:\n\n" +
                    "[" + code + "]\n\n" +
                    "5분 이내에 인증을 완료해 주세요.");

            // 만약 application.yml에 올바른 메일 설정이 없다면 에러가 날 수 있으므로 예외처리함
            emailSender.send(message);
            log.info("실제 이메일 발송 성공: {}", toEmail);
        } catch (Exception e) {
            log.warn("실제 이메일 발송 실패 (터미널 로그의 인증번호를 사용 가능): {}", e.getMessage());
        }
    }

    private boolean verifyCode(String email, String inputCode, String purpose) {
        return verifyCode(email, inputCode, purpose, true);
    }

    private boolean checkCode(String email, String inputCode, String purpose) {
        return verifyCode(email, inputCode, purpose, false);
    }

    private boolean verifyCode(String email, String inputCode, String purpose, boolean consumeOnSuccess) {
        String key = buildKey(email, purpose);
        VerificationInfo info = verificationCodes.get(key);

        if (info == null) {
            return false; // 코드가 발급된 적 없음
        }

        if (LocalDateTime.now().isAfter(info.expiryTime)) {
            verificationCodes.remove(key); // 만료됨
            return false;
        }

        if (info.code.equals(inputCode)) {
            if (consumeOnSuccess) {
                verificationCodes.remove(key); // 최종 인증 성공시 코드 폐기
            }
            return true;
        }

        return false;
    }

    private String generateCode() {
        return String.format("%06d", random.nextInt(1000000));
    }

    private void writeMockEmailToFile(String email, String code) {
        try {
            Path path = Paths.get("mock_emails.log");
            String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String logMessage = String.format("[%s] 발송 대상: %s | 인증코드: %s%n", time, email, code);
            Files.writeString(path, logMessage, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception e) {
            log.error("파일에 인증코드를 저장하는데 실패했습니다: {}", e.getMessage());
        }
    }

    private String buildKey(String email, String purpose) {
        return purpose + ":" + email;
    }
}
