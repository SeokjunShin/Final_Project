package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    public static final String USER = "USER";
    public static final String OPERATOR = "OPERATOR";
    public static final String REVIEW_ADMIN = "REVIEW_ADMIN";
    public static final String MASTER_ADMIN = "MASTER_ADMIN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 200)
    private String description;

    public Role(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
