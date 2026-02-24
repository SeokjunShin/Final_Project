package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String password;

    @Column(name = "name", nullable = false, length = 80)
    private String fullName;

    @Column(name = "phone", length = 30)
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @Transient
    private Integer failedLoginAttempts = 0;

    @Transient
    private LocalDateTime lockExpiryTime;

    public User(String email, String password, String fullName) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    public String getUsername() {
        return email;
    }

    public void setUsername(String username) {
        this.email = username;
    }

    public Boolean getEnabled() {
        return !"DISABLED".equalsIgnoreCase(status);
    }

    public void setEnabled(Boolean enabled) {
        if (Boolean.FALSE.equals(enabled)) {
            this.status = "DISABLED";
        } else if ("DISABLED".equalsIgnoreCase(this.status)) {
            this.status = "ACTIVE";
        }
    }

    public Boolean getLocked() {
        return "LOCKED".equalsIgnoreCase(status);
    }

    public void setLocked(Boolean locked) {
        if (Boolean.TRUE.equals(locked)) {
            this.status = "LOCKED";
        } else if ("LOCKED".equalsIgnoreCase(this.status)) {
            this.status = "ACTIVE";
        }
    }

    public void addRole(Role role) {
        this.roles.add(role);
    }

    public void removeRole(Role role) {
        this.roles.remove(role);
    }

    public boolean hasRole(String roleName) {
        return roles.stream().anyMatch(role -> role.getName().equals(roleName));
    }

    public void enable() {
        this.status = "ACTIVE";
    }

    public void disable() {
        this.status = "DISABLED";
    }

    public void lock() {
        this.status = "LOCKED";
    }

    public void unlock() {
        this.status = "ACTIVE";
    }
}
