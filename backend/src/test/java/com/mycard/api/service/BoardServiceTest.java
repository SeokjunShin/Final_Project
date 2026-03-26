package com.mycard.api.service;

import com.mycard.api.dto.board.BoardRequest;
import com.mycard.api.dto.board.BoardResponse;
import com.mycard.api.entity.Board;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.repository.BoardRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

    @Mock
    private BoardRepository boardRepository;

    @InjectMocks
    private BoardService boardService;

    @Test
    void findAllRejectsSqlInjectionPayloadInKeyword() {
        assertThatThrownBy(() -> boardService.findAll("' OR 1=1 #", "전체", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("검색어");

        verifyNoInteractions(boardRepository);
    }

    @Test
    void findByIdRejectsNonNumericIdentifier() {
        assertThatThrownBy(() -> boardService.findById("1 OR 1=1", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("게시글 ID");

        verifyNoInteractions(boardRepository);
    }

    @Test
    void createUsesValidatedValuesAndRepositorySave() {
        BoardRequest request = BoardRequest.builder()
                .title("  문의 제목  ")
                .content("  문의 내용  ")
                .category("사이트 문의")
                .allowedUsers(" 김철수, 이영희 ,김철수 ")
                .isPrivate(true)
                .build();

        when(boardRepository.save(any(Board.class))).thenAnswer(invocation -> {
            Board board = invocation.getArgument(0);
            board.setId(1L);
            return board;
        });

        BoardResponse response = boardService.create(request, "홍길동");

        ArgumentCaptor<Board> boardCaptor = ArgumentCaptor.forClass(Board.class);
        verify(boardRepository).save(boardCaptor.capture());

        Board savedBoard = boardCaptor.getValue();
        assertThat(savedBoard.getTitle()).isEqualTo("문의 제목");
        assertThat(savedBoard.getContent()).isEqualTo("문의 내용");
        assertThat(savedBoard.getCategory()).isEqualTo("사이트 문의");
        assertThat(savedBoard.getAllowedUsers()).isEqualTo("김철수,이영희");
        assertThat(savedBoard.isPrivate()).isTrue();

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getAuthorName()).isEqualTo("홍길동");
    }
}
