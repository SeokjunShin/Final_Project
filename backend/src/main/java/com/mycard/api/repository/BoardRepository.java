package com.mycard.api.repository;

import com.mycard.api.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {

    @Query("""
            SELECT b
            FROM Board b
            WHERE (:keyword IS NULL
                    OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:category IS NULL OR b.category = :category)
            ORDER BY b.id DESC
            """)
    List<Board> searchAll(@Param("keyword") String keyword, @Param("category") String category);

    @Query("""
            SELECT b
            FROM Board b
            WHERE (:keyword IS NULL
                    OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:category IS NULL OR b.category = :category)
              AND b.isPrivate = false
            ORDER BY b.id DESC
            """)
    List<Board> searchPublic(@Param("keyword") String keyword, @Param("category") String category);

    @Query("""
            SELECT b
            FROM Board b
            WHERE (:keyword IS NULL
                    OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:category IS NULL OR b.category = :category)
              AND (b.isPrivate = false
                    OR b.authorName = :userName
                    OR b.allowedUsers LIKE CONCAT('%', :userName, '%'))
            ORDER BY b.id DESC
            """)
    List<Board> searchVisibleToUser(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("userName") String userName);
}
