package com.mycard.api.repository;

import com.mycard.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

    Page<User> findByEmailContainingOrFullNameContaining(String email, String fullName, Pageable pageable);

    default Optional<User> findByUsername(String username) {
        return findByEmail(username);
    }

    default boolean existsByUsername(String username) {
        return existsByEmail(username);
    }

    default Optional<User> findByUsernameWithRoles(String username) {
        return findByEmailWithRoles(username);
    }

    default Page<User> findByUsernameContainingOrEmailContainingOrFullNameContaining(
            String username, String email, String fullName, Pageable pageable) {
        String keyword = (email != null && !email.isBlank()) ? email : username;
        return findByEmailContainingOrFullNameContaining(keyword, fullName, pageable);
    }

    /** 일정 기간 미접속인 활성(ACTIVE) 사용자 조회 (비활성 처리 대상) */
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' AND (u.lastLoginAt IS NULL OR u.lastLoginAt < :cutoff)")
    List<User> findActiveUsersWithLastLoginBeforeOrNull(@Param("cutoff") LocalDateTime cutoff);
}
