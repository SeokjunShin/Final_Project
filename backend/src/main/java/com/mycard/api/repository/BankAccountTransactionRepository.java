package com.mycard.api.repository;

import com.mycard.api.entity.BankAccountTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankAccountTransactionRepository extends JpaRepository<BankAccountTransaction, Long> {

    List<BankAccountTransaction> findTop5ByBankAccountIdOrderByCreatedAtDesc(Long bankAccountId);
}
