package com.mycard.api.controller;

import com.mycard.api.dto.board.BoardRequest;
import com.mycard.api.dto.board.BoardResponse;
import com.mycard.api.service.BoardService;
import com.mycard.api.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "자유게시판", description = "자유게시판 API (SQL Injection 취약점 포함)")
@RestController
@RequestMapping("/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @Operation(summary = "게시글 목록 조회")
    @GetMapping
    public ResponseEntity<List<BoardResponse>> getAllBoards(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(boardService.findAll(keyword, category, userPrincipal));
    }

    @Operation(summary = "게시글 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<BoardResponse> getBoardById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(boardService.findById(id, userPrincipal));
    }

    @Operation(summary = "게시글 작성")
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
            @RequestBody BoardRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(boardService.create(request, userPrincipal.getFullName()));
    }

    @Operation(summary = "게시글 수정")
    @PutMapping("/{id}")
    public ResponseEntity<BoardResponse> updateBoard(
            @PathVariable String id,
            @RequestBody BoardRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(boardService.update(id, request, userPrincipal));
    }

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        boardService.delete(id, userPrincipal);
        return ResponseEntity.ok().build();
    }
}
