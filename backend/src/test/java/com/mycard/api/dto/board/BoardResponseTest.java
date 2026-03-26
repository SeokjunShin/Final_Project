package com.mycard.api.dto.board;

import com.mycard.api.entity.Board;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BoardResponseTest {

    @Test
    void fromEscapesHtmlSensitiveFields() {
        Board board = Board.builder()
                .id(1L)
                .title("<script>alert(1)</script>")
                .content("<img src=x onerror=alert(1)>content")
                .authorName("<b>admin</b>")
                .allowedUsers("<i>user</i>")
                .answer("<svg onload=alert(1)>answer</svg>")
                .answerAuthorName("<u>operator</u>")
                .isPrivate(false)
                .build();

        BoardResponse response = BoardResponse.from(board);

        assertThat(response.getTitle()).isEqualTo("&lt;script&gt;alert(1)&lt;/script&gt;");
        assertThat(response.getContent()).isEqualTo("&lt;img src=x onerror=alert(1)&gt;content");
        assertThat(response.getAuthorName()).isEqualTo("&lt;b&gt;admin&lt;/b&gt;");
        assertThat(response.getAllowedUsers()).isEqualTo("&lt;i&gt;user&lt;/i&gt;");
        assertThat(response.getAnswer()).isEqualTo("&lt;svg onload=alert(1)&gt;answer&lt;/svg&gt;");
        assertThat(response.getAnswerAuthorName()).isEqualTo("&lt;u&gt;operator&lt;/u&gt;");
    }
}
