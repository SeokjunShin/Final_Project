package com.mycard.api.service;

import com.mycard.api.dto.board.BoardRequest;
import com.mycard.api.dto.board.BoardResponse;
import com.mycard.api.entity.Board;
import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.BoardRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private static final String DEFAULT_CATEGORY = "사이트 문의";
    private static final String ALL_CATEGORY = "전체";
    private static final Set<String> ALLOWED_CATEGORIES = Set.of(DEFAULT_CATEGORY, "금융 문의");
    private static final Pattern BOARD_ID_PATTERN = Pattern.compile("^\\d+$");
    private static final Pattern USER_NAME_PATTERN = Pattern.compile("^[\\p{L}\\p{N}\\s._()\\-]+$");
    private static final int MAX_SEARCH_KEYWORD_LENGTH = 100;
    private static final int MAX_NAME_LENGTH = 100;
    private static final int MAX_ALLOWED_USERS_LENGTH = 1000;
    private static final int MAX_TITLE_LENGTH = 255;
    private static final int MAX_CONTENT_LENGTH = 5000;
    private static final int MAX_ANSWER_LENGTH = 5000;

    private final BoardRepository boardRepository;

    private boolean isStaff(UserPrincipal userPrincipal) {
        return userPrincipal != null && userPrincipal.isStaff();
    }

    private String currentUserName(UserPrincipal userPrincipal) {
        if (userPrincipal == null || !StringUtils.hasText(userPrincipal.getFullName())) {
            return null;
        }
        return userPrincipal.getFullName().trim();
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> findAll(String keyword, String category, UserPrincipal userPrincipal) {
        String normalizedKeyword = normalizeSearchKeyword(keyword);
        String normalizedCategory = normalizeCategoryFilter(category);
        String userName = currentUserName(userPrincipal);

        List<Board> boards;
        if (isStaff(userPrincipal)) {
            boards = boardRepository.searchAll(normalizedKeyword, normalizedCategory);
        } else if (!StringUtils.hasText(userName)) {
            boards = boardRepository.searchPublic(normalizedKeyword, normalizedCategory);
        } else {
            boards = boardRepository.searchVisibleToUser(normalizedKeyword, normalizedCategory, userName);
        }

        return boards.stream()
                .filter(board -> canView(board, userPrincipal))
                .map(BoardResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BoardResponse findById(String id, UserPrincipal userPrincipal) {
        return BoardResponse.from(getAccessibleBoard(id, userPrincipal));
    }

    @Transactional
    public BoardResponse create(BoardRequest request, String authorName) {
        Board board = Board.builder()
                .title(normalizeRequiredText(request.getTitle(), "제목", MAX_TITLE_LENGTH))
                .content(normalizeRequiredText(request.getContent(), "내용", MAX_CONTENT_LENGTH))
                .authorName(normalizeUserName(authorName, "작성자 이름이 올바르지 않습니다."))
                .category(normalizeCategoryValue(request.getCategory()))
                .allowedUsers(normalizeAllowedUsers(request.getAllowedUsers()))
                .isPrivate(request.isPrivate())
                .build();

        return BoardResponse.from(boardRepository.save(board));
    }

    @Transactional
    public BoardResponse update(String id, BoardRequest request, UserPrincipal userPrincipal) {
        Board board = getAccessibleBoard(id, userPrincipal);
        String userName = currentUserName(userPrincipal);

        if (!isStaff(userPrincipal) && !board.getAuthorName().equals(userName)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        board.setTitle(normalizeRequiredText(request.getTitle(), "제목", MAX_TITLE_LENGTH));
        board.setContent(normalizeRequiredText(request.getContent(), "내용", MAX_CONTENT_LENGTH));
        board.setCategory(normalizeCategoryValue(request.getCategory()));
        board.setAllowedUsers(normalizeAllowedUsers(request.getAllowedUsers()));
        board.setPrivate(request.isPrivate());

        if (isStaff(userPrincipal)) {
            applyAnswer(board, request.getAnswer(), userName);
        }

        return BoardResponse.from(boardRepository.save(board));
    }

    @Transactional
    public void delete(String id, UserPrincipal userPrincipal) {
        Board board = getAccessibleBoard(id, userPrincipal);
        String userName = currentUserName(userPrincipal);

        if (!isStaff(userPrincipal) && !board.getAuthorName().equals(userName)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        boardRepository.delete(board);
    }

    private Board getAccessibleBoard(String id, UserPrincipal userPrincipal) {
        Long boardId = parseBoardId(id);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다."));

        if (!canView(board, userPrincipal)) {
            throw new AccessDeniedException("게시글을 볼 권한이 없습니다.");
        }
        return board;
    }

    private boolean canView(Board board, UserPrincipal userPrincipal) {
        if (!board.isPrivate() || isStaff(userPrincipal)) {
            return true;
        }

        String userName = currentUserName(userPrincipal);
        if (!StringUtils.hasText(userName)) {
            return false;
        }

        return userName.equals(board.getAuthorName()) || isAllowedUser(board.getAllowedUsers(), userName);
    }

    private boolean isAllowedUser(String allowedUsers, String userName) {
        if (!StringUtils.hasText(allowedUsers)) {
            return false;
        }

        return Arrays.stream(allowedUsers.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .anyMatch(userName::equals);
    }

    private void applyAnswer(Board board, String answer, String answerAuthorName) {
        if (!StringUtils.hasText(answer)) {
            board.setAnswer(null);
            board.setAnswerAuthorName(null);
            board.setAnswerUpdatedAt(null);
            return;
        }

        board.setAnswer(normalizeRequiredText(answer, "답변", MAX_ANSWER_LENGTH));
        board.setAnswerAuthorName(normalizeUserName(answerAuthorName, "답변 작성자 이름이 올바르지 않습니다."));
        board.setAnswerUpdatedAt(LocalDateTime.now());
    }

    private Long parseBoardId(String id) {
        if (!StringUtils.hasText(id) || !BOARD_ID_PATTERN.matcher(id.trim()).matches()) {
            throw new BadRequestException("게시글 ID가 올바르지 않습니다.");
        }
        return Long.parseLong(id.trim());
    }

    private String normalizeSearchKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }

        String normalized = keyword.trim();
        if (normalized.length() > MAX_SEARCH_KEYWORD_LENGTH) {
            throw new BadRequestException("검색어는 100자 이하여야 합니다.");
        }
        return normalized;
    }

    private String normalizeCategoryFilter(String category) {
        if (!StringUtils.hasText(category) || ALL_CATEGORY.equals(category.trim())) {
            return null;
        }

        return normalizeCategoryValue(category);
    }

    private String normalizeCategoryValue(String category) {
        String normalized = StringUtils.hasText(category) ? category.trim() : DEFAULT_CATEGORY;
        if (!ALLOWED_CATEGORIES.contains(normalized)) {
            throw new BadRequestException("유효하지 않은 카테고리입니다.");
        }
        return normalized;
    }

    private String normalizeAllowedUsers(String allowedUsers) {
        if (!StringUtils.hasText(allowedUsers)) {
            return null;
        }

        List<String> normalizedUsers = Arrays.stream(allowedUsers.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());

        if (normalizedUsers.isEmpty()) {
            return null;
        }

        normalizedUsers.forEach(userName -> normalizeUserName(userName, "열람 허용 대상자 이름 형식이 올바르지 않습니다."));

        String normalized = String.join(",", normalizedUsers);
        if (normalized.length() > MAX_ALLOWED_USERS_LENGTH) {
            throw new BadRequestException("열람 허용 대상자 목록이 너무 깁니다.");
        }
        return normalized;
    }

    private String normalizeRequiredText(String value, String fieldName, int maxLength) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException(fieldName + "은(는) 필수입니다.");
        }

        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new BadRequestException(fieldName + "은(는) " + maxLength + "자 이하여야 합니다.");
        }
        return normalized;
    }

    private String normalizeUserName(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException(message);
        }

        String normalized = value.trim();
        if (normalized.length() > MAX_NAME_LENGTH || !USER_NAME_PATTERN.matcher(normalized).matches()) {
            throw new BadRequestException(message);
        }
        return normalized;
    }
}
