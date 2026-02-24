package com.mycard.api.controller;

import com.mycard.api.dto.EventResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 이벤트 API 컨트롤러
 */
@Tag(name = "Events", description = "이벤트 API")
@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /**
     * 활성 이벤트 목록 조회
     */
    @Operation(summary = "이벤트 목록 조회", description = "진행 중인 이벤트 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<EventResponse>> getEvents(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        Page<EventResponse> events = eventService.getActiveEvents(userId, pageable);
        return ResponseEntity.ok(events);
    }

    /**
     * 이벤트 상세 조회
     */
    @Operation(summary = "이벤트 상세 조회", description = "특정 이벤트의 상세 정보를 조회합니다.")
    @GetMapping("/{eventId}")
    public ResponseEntity<EventResponse> getEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        EventResponse event = eventService.getEvent(eventId, userId);
        return ResponseEntity.ok(event);
    }

    /**
     * 이벤트 참여
     */
    @Operation(summary = "이벤트 참여", description = "이벤트에 참여합니다.")
    @PostMapping("/{eventId}/participate")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<Void> participateEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        eventService.participateEvent(eventId, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * 내 이벤트 참여 목록 조회
     */
    @Operation(summary = "내 참여 이벤트 조회", description = "내가 참여한 이벤트 목록을 조회합니다.")
    @GetMapping("/my-participations")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<List<EventResponse>> getMyParticipations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<EventResponse> participations = eventService.getMyParticipations(userPrincipal.getId());
        return ResponseEntity.ok(participations);
    }
}
