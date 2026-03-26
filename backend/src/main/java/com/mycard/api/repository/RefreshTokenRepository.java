package com.mycard.api.repository;

import com.mycard.api.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Query("""
            SELECT rt
            FROM RefreshToken rt
            WHERE rt.user.id = :userId
              AND rt.sessionId = :sessionId
              AND rt.revokedAt IS NULL
              AND rt.expiresAt > :now
              AND rt.absoluteExpiresAt > :now
            ORDER BY rt.createdAt DESC
            """)
    List<RefreshToken> findActiveTokensByUserIdAndSessionId(
            @Param("userId") Long userId,
            @Param("sessionId") String sessionId,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT rt
            FROM RefreshToken rt
            WHERE rt.user.id = :userId
              AND rt.revokedAt IS NULL
              AND rt.expiresAt > :now
              AND rt.absoluteExpiresAt > :now
            """)
    List<RefreshToken> findActiveTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Query("""
            SELECT CASE WHEN COUNT(rt) > 0 THEN true ELSE false END
            FROM RefreshToken rt
            WHERE rt.user.id = :userId
              AND rt.sessionId = :sessionId
              AND rt.revokedAt IS NULL
              AND rt.expiresAt > :now
              AND rt.absoluteExpiresAt > :now
            """)
    boolean existsActiveSession(
            @Param("userId") Long userId,
            @Param("sessionId") String sessionId,
            @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now WHERE rt.user.id = :userId AND rt.revokedAt IS NULL")
    int revokeAllUserTokens(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            UPDATE RefreshToken rt
            SET rt.revokedAt = :now
            WHERE rt.user.id = :userId
              AND rt.sessionId = :sessionId
              AND rt.revokedAt IS NULL
            """)
    int revokeSessionTokens(
            @Param("userId") Long userId,
            @Param("sessionId") String sessionId,
            @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now OR rt.revokedAt IS NOT NULL")
    int deleteExpiredOrRevokedTokens(@Param("now") LocalDateTime now);
}
