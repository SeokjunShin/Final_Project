package com.mycard.api.service;

import com.mycard.api.dto.board.BoardRequest;
import com.mycard.api.dto.board.BoardResponse;
import com.mycard.api.entity.Board;
import com.mycard.api.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final EntityManager entityManager;

    private boolean isStaff(UserPrincipal userPrincipal) {
        return userPrincipal != null && userPrincipal.isStaff();
    }

    private String escapeSql(String value) {
        return value != null ? value.replace("'", "''") : "";
    }

    private String currentUserName(UserPrincipal userPrincipal) {
        return userPrincipal != null ? escapeSql(userPrincipal.getFullName()) : "";
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> findAll(String keyword, String category, UserPrincipal userPrincipal) {
        String queryString = "SELECT * FROM boards WHERE 1=1";

        if (keyword != null && !keyword.isEmpty()) {
            queryString += " AND (title LIKE '%" + keyword + "%' OR content LIKE '%" + keyword + "%')";
        }

        if (category != null && !category.isEmpty() && !category.equals("전체")) {
            queryString += " AND category = '" + category + "'";
        }

        System.out.println("EXECUTING SQL QUERY: " + queryString);

        if (!isStaff(userPrincipal)) {
            String userName = currentUserName(userPrincipal);
            queryString += " AND (is_private = FALSE OR author_name = '" + userName + "' OR allowed_users LIKE '%"
                    + userName + "%')";
        }
        queryString += " ORDER BY id DESC";

        @SuppressWarnings("unchecked")
        List<Board> boards = entityManager.createNativeQuery(queryString, Board.class).getResultList();
        return boards.stream().map(BoardResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BoardResponse findById(String id, UserPrincipal userPrincipal) {
        String queryString = "SELECT * FROM boards WHERE id = " + id;

        if (!isStaff(userPrincipal)) {
            String userName = currentUserName(userPrincipal);
            queryString += " AND (is_private = FALSE OR author_name = '" + userName + "' OR allowed_users LIKE '%"
                    + userName + "%')";
        }

        List<?> result = entityManager.createNativeQuery(queryString, Board.class).getResultList();
        if (result.isEmpty()) {
            throw new RuntimeException("게시글을 찾을 수 없거나 권한이 없습니다.");
        }
        return BoardResponse.from((Board) result.get(0));
    }

    @Transactional
    public BoardResponse create(BoardRequest request, String authorName) {
        int isPrivateInt = request.isPrivate() ? 1 : 0;

        String safeTitle = escapeSql(request.getTitle());
        String safeContent = escapeSql(request.getContent());
        String safeCategory = request.getCategory() != null ? escapeSql(request.getCategory()) : "사이트 문의";
        String safeAllowedUsers = escapeSql(request.getAllowedUsers());
        String safeAuthorName = escapeSql(authorName);

        String queryString = String.format(
                "INSERT INTO boards (title, content, author_name, category, allowed_users, is_private, created_at, updated_at) VALUES ('%s', '%s', '%s', '%s', '%s', %d, NOW(), NOW())",
                safeTitle, safeContent, safeAuthorName, safeCategory, safeAllowedUsers, isPrivateInt);
        entityManager.createNativeQuery(queryString).executeUpdate();

        Long lastId = ((Number) entityManager.createNativeQuery("SELECT LAST_INSERT_ID()").getSingleResult())
                .longValue();
        String selectQuery = "SELECT * FROM boards WHERE id = " + lastId;
        Board board = (Board) entityManager.createNativeQuery(selectQuery, Board.class).getSingleResult();
        return BoardResponse.from(board);
    }

    @Transactional
    public BoardResponse update(String id, BoardRequest request, UserPrincipal userPrincipal) {
        BoardResponse existing = findById(id, userPrincipal);
        boolean isStaff = isStaff(userPrincipal);
        if (!isStaff && !existing.getAuthorName().equals(userPrincipal.getFullName())) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        int isPrivateInt = request.isPrivate() ? 1 : 0;

        String safeTitle = escapeSql(request.getTitle());
        String safeContent = escapeSql(request.getContent());
        String safeCategory = request.getCategory() != null ? escapeSql(request.getCategory()) : "사이트 문의";
        String safeAllowedUsers = escapeSql(request.getAllowedUsers());
        String safeAnswer = escapeSql(request.getAnswer());

        String answerFields = "";
        if (isStaff) {
            if (request.getAnswer() == null || request.getAnswer().isBlank()) {
                answerFields = ", answer = NULL, answer_author_name = NULL, answer_updated_at = NULL";
            } else {
                answerFields = String.format(
                        ", answer = '%s', answer_author_name = '%s', answer_updated_at = NOW()",
                        safeAnswer,
                        currentUserName(userPrincipal));
            }
        }

        String queryString = String.format(
                "UPDATE boards SET title = '%s', content = '%s', category = '%s', allowed_users = '%s', is_private = %d, updated_at = NOW()%s WHERE id = %s",
                safeTitle, safeContent, safeCategory, safeAllowedUsers, isPrivateInt, answerFields, id);
        entityManager.createNativeQuery(queryString).executeUpdate();

        return findById(id, userPrincipal);
    }

    @Transactional
    public void delete(String id, UserPrincipal userPrincipal) {
        BoardResponse existing = findById(id, userPrincipal);
        if (!isStaff(userPrincipal) && !existing.getAuthorName().equals(userPrincipal.getFullName())) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        String queryString = "DELETE FROM boards WHERE id = " + id;
        entityManager.createNativeQuery(queryString).executeUpdate();
    }
}
