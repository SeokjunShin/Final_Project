package com.mycard.api.util;

public class MaskingUtils {

    /**
     * 성명 마스킹: 홍길동 -> 홍*동, 김철수 -> 김*수, 홍길 -> 홍*
     */
    public static String maskName(String name) {
        if (name == null || name.length() < 2) {
            return name;
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        return name.charAt(0) + "*" + name.substring(2);
    }

    /**
     * 연락처 마스킹: 010-1234-5678 -> 010-1234-****
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        return phone.substring(0, phone.length() - 4) + "****";
    }

    /**
     * 이메일 마스킹: test1234@example.com -> te**1234@example.com -> te**@example.com (간소화)
     * 기준: 앞 2자리 유지, @ 이전까지 마스킹
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];

        if (local.length() <= 2) {
            return local + "**@" + domain;
        }
        return local.substring(0, 2) + "**@" + domain;
    }

    /**
     * 주소 상세 마스킹: 전체 마스킹
     */
    public static String maskAddressDetail(String detail) {
        if (detail == null || detail.isBlank()) {
            return detail;
        }
        return "****";
    }

    /**
     * 카드번호 마스킹: 9430-82**-****-2393 (7~12번째 마스킹)
     * 입력 형식이 하이픈 포함일 경우 처리
     */
    public static String maskCardNumber(String cardNumber) {
        if (cardNumber == null) return null;
        String clean = cardNumber.replaceAll("-", "");
        if (clean.length() < 16) return cardNumber;
        
        // 9430 82 (6자리) + ** (7,8) + **** (9,10,11,12) + 2393 (13,14,15,16)
        StringBuilder sb = new StringBuilder();
        sb.append(clean.substring(0, 4)).append("-");
        sb.append(clean.substring(4, 6)).append("**-");
        sb.append("****-");
        sb.append(clean.substring(12));
        return sb.toString();
    }

    /**
     * 계좌번호 마스킹: 뒤 5자리 마스킹
     */
    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 5) {
            return accountNumber;
        }
        return accountNumber.substring(0, accountNumber.length() - 5) + "*****";
    }
}
