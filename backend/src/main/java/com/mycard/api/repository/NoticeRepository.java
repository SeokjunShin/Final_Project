package com.mycard.api.repository;

import com.mycard.api.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    @Query("SELECT n FROM Notice n WHERE n.published = true ORDER BY n.createdAt DESC")
    Page<Notice> findPublishedNotices(@Param("now") LocalDateTime now, Pageable pageable);

    default List<Notice> findPinnedNotices(@Param("now") LocalDateTime now) {
        return Collections.emptyList();
    }

    @Query("SELECT n FROM Notice n WHERE n.published = true ORDER BY n.createdAt DESC")
    Page<Notice> findPublishedByCategory(@Param("category") Notice.NoticeCategory category, @Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT n FROM Notice n ORDER BY n.createdAt DESC")
    Page<Notice> findAllNotices(Pageable pageable);

    @Query("SELECT n FROM Notice n WHERE n.published = true ORDER BY n.createdAt DESC")
    Page<Notice> findByPublishedTrueOrderByPinnedDescPublishedAtDesc(Pageable pageable);

    @Query("SELECT n FROM Notice n WHERE n.published = true ORDER BY n.createdAt DESC")
    Page<Notice> findByPublishedTrueAndCategoryOrderByPinnedDescPublishedAtDesc(
            Notice.NoticeCategory category, Pageable pageable);

    default List<Notice> findByPublishedTrueAndPinnedTrueOrderByPublishedAtDesc() {
        return Collections.emptyList();
    }
}
