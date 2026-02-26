package com.mycard.api.service;

import com.mycard.api.dto.EventCreateRequest;
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
import java.util.Optional;
import java.util.stream.Collectors;
import java.math.BigDecimal;

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
    private final PointService pointService;

    /**
     * 활성 이벤트 목록 조회 (ACTIVE + CLOSED)
     */
    public Page<EventResponse> getActiveEvents(Long userId, Pageable pageable) {
        Page<Event> events = eventRepository.findByStatusIn(
                List.of(Event.EventStatus.ACTIVE, Event.EventStatus.CLOSED), pageable);

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
     * 이벤트 생성
     */
    @Transactional
    public Event createEvent(EventCreateRequest request, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("종료일이 시작일보다 이전일 수 없습니다.");
        }

        Event event = new Event(
                request.getTitle(),
                request.getDescription(),
                request.getStartDate(),
                request.getEndDate());
        event.setImageUrl(request.getImageUrl());
        event.setStatus(Event.EventStatus.ACTIVE);
        event.setCreatedBy(creator);

        return eventRepository.save(event);
    }

    /**
     * 이벤트 마감 처리
     */
    @Transactional
    public void closeEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("이벤트", eventId));

        if (event.getStatus() == Event.EventStatus.CLOSED) {
            throw new BadRequestException("이미 마감된 이벤트입니다.");
        }

        event.setStatus(Event.EventStatus.CLOSED);
        eventRepository.save(event);
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
    }

    /**
     * 당첨 처리 (여러 명 가능) 및 포인트 지급 연동
     */
    @Transactional
    public void setWinners(Long eventId, List<Long> participationIds, Integer rewardPoints) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("이벤트", eventId));

        for (Long participationId : participationIds) {
            EventParticipation participation = participationRepository.findById(participationId)
                    .orElseThrow(() -> new ResourceNotFoundException("참여 정보", participationId));

            if (!participation.getEvent().getId().equals(eventId)) {
                throw new BadRequestException("해당 이벤트의 참여 정보가 아닙니다.");
            }

            participation.setWinner(true);
            participation.setAnnouncedAt(LocalDateTime.now());
            participationRepository.save(participation);

            // 이벤트 당첨 보상금 지급
            if (rewardPoints != null && rewardPoints > 0) {
                pointService.rewardEventPoints(participation.getUser().getId(), BigDecimal.valueOf(rewardPoints),
                        event.getTitle(), event.getId());
            }
        }
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
        boolean isParticipated = false;
        boolean isWinner = false;

        if (userId != null) {
            Optional<EventParticipation> participation = participationRepository.findByEventIdAndUserId(event.getId(),
                    userId);
            if (participation.isPresent()) {
                isParticipated = true;
                isWinner = Boolean.TRUE.equals(participation.get().getWinner());
            }
        }

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
                .isWinner(isWinner)
                .createdAt(event.getCreatedAt())
                .build();
    }
}
