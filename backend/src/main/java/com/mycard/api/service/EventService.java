package com.mycard.api.service;

import com.mycard.api.dto.EventResponse;
import com.mycard.api.entity.Event;
import com.mycard.api.entity.EventParticipation;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.EventParticipationRepository;
import com.mycard.api.repository.EventRepository;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 이벤트 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final EventParticipationRepository participationRepository;
    private final UserRepository userRepository;

    /**
     * 활성 이벤트 목록 조회
     */
    public Page<EventResponse> getActiveEvents(Long userId, Pageable pageable) {
        Page<Event> events = eventRepository.findByStatusOrderByStartDateDesc(
                Event.EventStatus.ACTIVE, pageable);

        return events.map(event -> toResponse(event, userId));
    }

    /**
     * 이벤트 상세 조회
     */
    public EventResponse getEvent(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("이벤트", eventId));

        if (event.getStatus() == Event.EventStatus.DRAFT) {
            throw new ResourceNotFoundException("이벤트", eventId);
        }

        return toResponse(event, userId);
    }

    /**
     * 이벤트 참여
     */
    @Transactional
    public void participateEvent(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("이벤트", eventId));

        // 이벤트 상태 확인
        if (event.getStatus() != Event.EventStatus.ACTIVE) {
            throw new BadRequestException("현재 참여할 수 없는 이벤트입니다.");
        }

        // 기간 확인
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(event.getStartDate()) || now.isAfter(event.getEndDate())) {
            throw new BadRequestException("이벤트 참여 기간이 아닙니다.");
        }

        // 정원 확인
        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new BadRequestException("이벤트 정원이 마감되었습니다.");
        }

        // 중복 참여 확인
        if (participationRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new BadRequestException("이미 참여한 이벤트입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));

        // 참여 등록
        EventParticipation participation = EventParticipation.builder()
                .event(event)
                .user(user)
                .build();
        participationRepository.save(participation);

        // 참여자 수 증가
        event.incrementParticipants();
    }

    /**
     * 내 이벤트 참여 목록 조회
     */
    public List<EventResponse> getMyParticipations(Long userId) {
        return participationRepository.findByUserIdOrderByParticipatedAtDesc(userId)
                .stream()
                .map(p -> toResponse(p.getEvent(), userId))
                .collect(Collectors.toList());
    }

    private EventResponse toResponse(Event event, Long userId) {
        boolean isParticipated = userId != null &&
                participationRepository.existsByEventIdAndUserId(event.getId(), userId);

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .status(event.getStatus().name())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .maxParticipants(event.getMaxParticipants())
                .currentParticipants(event.getCurrentParticipants())
                .imageUrl(event.getImageUrl())
                .isParticipated(isParticipated)
                .createdAt(event.getCreatedAt())
                .build();
    }
}
