package com.mycard.api.config;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-GCM 암호화 유틸리티
 * 개인정보(주민번호, 연소득 등) 암호화에 사용
 */
public class EncryptionUtil {
    
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    
    // 실제 운영 환경에서는 환경변수나 Vault에서 키를 관리해야 합니다
    private static final String SECRET_KEY = System.getenv("ENCRYPTION_SECRET_KEY") != null 
            ? System.getenv("ENCRYPTION_SECRET_KEY") 
            : "MyCard!SecretKey32BytesLong!!"; // 32 bytes for AES-256
    
    private static final SecretKeySpec keySpec;
    
    static {
        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        // 키가 32바이트가 아니면 패딩하거나 자르기
        byte[] key = new byte[32];
        System.arraycopy(keyBytes, 0, key, 0, Math.min(keyBytes.length, 32));
        keySpec = new SecretKeySpec(key, "AES");
    }
    
    private EncryptionUtil() {
        // 유틸리티 클래스
    }
    
    /**
     * 문자열 암호화
     * @param plainText 평문
     * @return Base64 인코딩된 암호문 (IV + 암호문)
     */
    public static String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        
        try {
            // IV 생성
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);
            
            // 암호화
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, parameterSpec);
            
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // IV + 암호문 결합
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("암호화 실패", e);
        }
    }
    
    /**
     * 문자열 복호화
     * @param encryptedText Base64 인코딩된 암호문
     * @return 복호화된 평문
     */
    public static String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }
        
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedText);
            
            // IV, 암호문 분리
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);
            
            // 복호화
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, parameterSpec);
            
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("복호화 실패", e);
        }
    }
    
    /**
     * 주민번호 마스킹 (앞 6자리만 표시)
     */
    public static String maskSsn(String ssn) {
        if (ssn == null || ssn.length() < 7) {
            return "******-*******";
        }
        String cleaned = ssn.replaceAll("-", "");
        if (cleaned.length() >= 6) {
            return cleaned.substring(0, 6) + "-*******";
        }
        return "******-*******";
    }
}
