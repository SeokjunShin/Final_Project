package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bank_codes")
@Getter
@Setter
@NoArgsConstructor
public class BankCode {

    @Id
    @Column(name = "code", length = 10)
    private String code;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "swift_code", length = 20)
    private String swiftCode;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public BankCode(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
