package com.mycard.api.controller;

import com.mycard.api.dto.NoticeResponse;
import com.mycard.api.entity.Notice;
import com.mycard.api.service.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공지사항 API 컨트롤러
 */
@Tag(name = "Notices", description = "공지사항 API")
@RestController
@RequestMapping("/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * 공지사항 목록 조회
     */
    @Operation(summary = "공지사항 목록 조회", description = "공지사항 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<NoticeResponse>> getNotices(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<NoticeResponse> notices;
        if (category != null && !category.isEmpty()) {
            Notice.NoticeCategory cat = Notice.NoticeCategory.valueOf(category.toUpperCase());
            notices = noticeService.getNoticesByCategory(cat, pageable);
        } else {
            notices = noticeService.getNotices(pageable);
        }

        return ResponseEntity.ok(notices);
    }

    /**
     * 고정 공지사항 목록 조회
     */
    @Operation(summary = "고정 공지사항 조회", description = "상단 고정된 공지사항을 조회합니다.")
    @GetMapping("/pinned")
    public ResponseEntity<List<NoticeResponse>> getPinnedNotices() {
        List<NoticeResponse> pinnedNotices = noticeService.getPinnedNotices();
        return ResponseEntity.ok(pinnedNotices);
    }

    /**
     * 공지사항 상세 조회
     */
    @Operation(summary = "공지사항 상세 조회", description = "특정 공지사항의 상세 내용을 조회합니다.")
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeResponse> getNotice(@PathVariable Long noticeId) {
        NoticeResponse notice = noticeService.getNotice(noticeId);
        return ResponseEntity.ok(notice);
    }
}
