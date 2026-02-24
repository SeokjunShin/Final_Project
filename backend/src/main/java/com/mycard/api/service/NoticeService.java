package com.mycard.api.service;

import com.mycard.api.dto.NoticeResponse;
import com.mycard.api.entity.Notice;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 공지사항 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    /**
     * 공지사항 목록 조회 (고정글 포함)
     */
    public Page<NoticeResponse> getNotices(Pageable pageable) {
        return noticeRepository.findByPublishedTrueOrderByPinnedDescPublishedAtDesc(pageable)
                .map(this::toResponse);
    }

    /**
     * 카테고리별 공지사항 목록 조회
     */
    public Page<NoticeResponse> getNoticesByCategory(Notice.NoticeCategory category, Pageable pageable) {
        return noticeRepository.findByPublishedTrueAndCategoryOrderByPinnedDescPublishedAtDesc(category, pageable)
                .map(this::toResponse);
    }

    /**
     * 고정 공지사항 목록 조회
     */
    public List<NoticeResponse> getPinnedNotices() {
        return noticeRepository.findByPublishedTrueAndPinnedTrueOrderByPublishedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 공지사항 상세 조회
     */
    @Transactional
    public NoticeResponse getNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("공지사항", noticeId));

        if (!notice.getPublished()) {
            throw new ResourceNotFoundException("공지사항", noticeId);
        }

        // 조회수 증가
        notice.increaseViewCount();

        return toResponse(notice);
    }

    private NoticeResponse toResponse(Notice notice) {
        return NoticeResponse.builder()
                .id(notice.getId())
                .category(notice.getCategory().name())
                .title(notice.getTitle())
                .content(notice.getContent())
                .authorName(notice.getAuthor() != null ? notice.getAuthor().getFullName() : null)
                .pinned(notice.getPinned())
                .viewCount(notice.getViewCount())
                .publishedAt(notice.getPublishedAt())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}
