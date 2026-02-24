package com.mycard.api.repository;

import com.mycard.api.entity.PointBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface PointBalanceRepository extends JpaRepository<PointBalance, Long> {

    @Query("SELECT pb FROM PointBalance pb WHERE pb.user.id = :userId")
    Optional<PointBalance> findByUserId(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pb FROM PointBalance pb WHERE pb.user.id = :userId")
    Optional<PointBalance> findByUserIdForUpdate(@Param("userId") Long userId);
}
