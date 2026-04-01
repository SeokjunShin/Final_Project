package com.mycard.api.security;

import com.mycard.api.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class AdminPemKeyVerifier {

    private final String allowedPublicKeyPem;

    public AdminPemKeyVerifier(
            @Value("${app.security.admin-password-change-public-key-pem:}") String allowedPublicKeyPem) {
        this.allowedPublicKeyPem = allowedPublicKeyPem;
    }

    public void verifyOrThrow(String providedPem) {
        if (!StringUtils.hasText(allowedPublicKeyPem)) {
            throw new BadRequestException("서버에 관리자 비밀번호 변경용 PEM 공개키가 설정되어 있지 않습니다.");
        }
        if (!StringUtils.hasText(providedPem)) {
            throw new BadRequestException("PEM 키를 입력하세요.");
        }

        try {
            String expectedFingerprint = fingerprint(parsePublicKeyPem(allowedPublicKeyPem));
            String providedFingerprint = fingerprint(resolveToPublicKey(providedPem));
            if (!MessageDigest.isEqual(
                    expectedFingerprint.getBytes(StandardCharsets.UTF_8),
                    providedFingerprint.getBytes(StandardCharsets.UTF_8))) {
                throw new BadRequestException("PEM 키 검증에 실패했습니다.");
            }
        } catch (BadRequestException ex) {
            throw ex;
        } catch (GeneralSecurityException | IllegalArgumentException | ClassCastException ex) {
            throw new BadRequestException("지원하지 않는 PEM 키 형식입니다. RSA 공개키 또는 PKCS#8 개인키를 사용하세요.");
        }
    }

    private PublicKey resolveToPublicKey(String pem) throws GeneralSecurityException {
        if (pem.contains("BEGIN PUBLIC KEY")) {
            return parsePublicKeyPem(pem);
        }
        return derivePublicKeyFromPrivatePem(pem);
    }

    private PublicKey parsePublicKeyPem(String pem) throws GeneralSecurityException {
        byte[] encoded = decodePem(pem, "PUBLIC KEY");
        X509EncodedKeySpec spec = new X509EncodedKeySpec(encoded);
        return KeyFactory.getInstance("RSA").generatePublic(spec);
    }

    private PublicKey derivePublicKeyFromPrivatePem(String pem) throws GeneralSecurityException {
        if (pem.contains("BEGIN RSA PRIVATE KEY")) {
            throw new BadRequestException("PKCS#1 형식은 지원하지 않습니다. PKCS#8 개인키를 사용하세요.");
        }

        byte[] encoded = decodePem(pem, "PRIVATE KEY");
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(encoded);
        RSAPrivateCrtKey privateKey = (RSAPrivateCrtKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
        RSAPublicKeySpec publicKeySpec = new RSAPublicKeySpec(privateKey.getModulus(), privateKey.getPublicExponent());
        return KeyFactory.getInstance("RSA").generatePublic(publicKeySpec);
    }

    private byte[] decodePem(String pem, String type) {
        String normalized = pem
                .replace("\r", "")
                .replace("\\n", "\n")
                .trim();
        String header = "-----BEGIN " + type + "-----";
        String footer = "-----END " + type + "-----";
        String base64 = normalized
                .replace(header, "")
                .replace(footer, "")
                .replaceAll("\\s", "");
        if (!StringUtils.hasText(base64)) {
            throw new BadRequestException("PEM 키 형식이 올바르지 않습니다.");
        }
        return Base64.getDecoder().decode(base64);
    }

    private String fingerprint(PublicKey publicKey) throws GeneralSecurityException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return Base64.getEncoder().encodeToString(digest.digest(publicKey.getEncoded()));
    }
}
