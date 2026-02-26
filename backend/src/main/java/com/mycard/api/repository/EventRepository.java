package com.mycard.api.repository;

import com.mycard.api.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e WHERE e.status = 'ACTIVE' AND e.startDate <= :now AND e.endDate >= :now ORDER BY e.startDate ASC")
    Page<Event> findActiveEvents(@Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT e FROM Event e ORDER BY e.createdAt DESC")
    Page<Event> findAllEvents(Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status = :status ORDER BY e.createdAt DESC")
    Page<Event> findByStatus(@Param("status") Event.EventStatus status, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status = :status ORDER BY e.startDate DESC")
    Page<Event> findByStatusOrderByStartDateDesc(@Param("status") Event.EventStatus status, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status IN :statuses ORDER BY e.startDate DESC")
    Page<Event> findByStatusIn(@Param("statuses") java.util.List<Event.EventStatus> statuses, Pageable pageable);
}
