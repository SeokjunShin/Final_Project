package com.mycard.api.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter - DB 저장 시 자동 암호화/복호화
 * 민감한 개인정보 필드에 @Convert(converter = EncryptedStringConverter.class) 사용
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    
    @Override
    public String convertToDatabaseColumn(String attribute) {
        return EncryptionUtil.encrypt(attribute);
    }
    
    @Override
    public String convertToEntityAttribute(String dbData) {
        return EncryptionUtil.decrypt(dbData);
    }
}
