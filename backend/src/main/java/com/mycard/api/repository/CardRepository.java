package com.mycard.api.repository;

import com.mycard.api.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByUserId(Long userId);

    List<Card> findByStatusOrderByUpdatedAtDesc(Card.CardStatus status);

    @Query("SELECT c FROM Card c LEFT JOIN FETCH c.user WHERE c.status = :status ORDER BY c.updatedAt DESC")
    List<Card> findByStatusWithUserOrderByUpdatedAtDesc(@Param("status") Card.CardStatus status);

    @Query("SELECT c FROM Card c WHERE c.user.id = :userId AND c.status IN ('ACTIVE', 'SUSPENDED', 'REISSUE_REQUESTED')")
    List<Card> findActiveCardsByUserId(@Param("userId") Long userId);

    Optional<Card> findByCardNumber(String cardNumber);

    @Query("SELECT c FROM Card c WHERE c.id = :id AND c.user.id = :userId")
    Optional<Card> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    boolean existsByCardNumber(String cardNumber);
}
