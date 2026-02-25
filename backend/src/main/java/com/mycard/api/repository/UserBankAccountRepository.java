package com.mycard.api.repository;

import com.mycard.api.entity.UserBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBankAccountRepository extends JpaRepository<UserBankAccount, Long> {

    List<UserBankAccount> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<UserBankAccount> findByIdAndUserId(Long id, Long userId);

    Optional<UserBankAccount> findByUserIdAndIsDefaultTrue(Long userId);

    @Query("SELECT COUNT(a) FROM UserBankAccount a WHERE a.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserBankAccount a SET a.isDefault = false WHERE a.user.id = :userId AND a.id != :accountId")
    void clearDefaultExcept(@Param("userId") Long userId, @Param("accountId") Long accountId);

    boolean existsByUserIdAndBankCodeAndAccountNumber(Long userId, String bankCode, String accountNumber);
}
