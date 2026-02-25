package com.mycard.api.repository;

import com.mycard.api.entity.BankCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankCodeRepository extends JpaRepository<BankCode, String> {

    @Query("SELECT b FROM BankCode b WHERE b.isActive = true ORDER BY b.name ASC")
    List<BankCode> findByIsActiveTrueOrderByNameAsc();
}
