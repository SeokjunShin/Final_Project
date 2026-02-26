package com.mycard.api.exception;

import com.mycard.api.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        log.debug("Resource not found: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage(),
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        log.debug("Access denied: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "ACCESS_DENIED",
                ex.getMessage(),
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleSpringAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
        log.debug("Spring access denied: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "ACCESS_DENIED",
                "이 작업을 수행할 권한이 없습니다.",
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(
            BadRequestException ex, WebRequest request) {
        log.debug("Bad request: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
            DuplicateResourceException ex, WebRequest request) {
        log.debug("Duplicate resource: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "DUPLICATE_RESOURCE",
                ex.getMessage(),
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        log.debug("Bad credentials attempt");
        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "INVALID_CREDENTIALS",
                "아이디 또는 비밀번호가 올바르지 않습니다.",
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ErrorResponse> handleLockedException(
            LockedException ex, WebRequest request) {
        log.debug("Account locked");
        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "ACCOUNT_LOCKED",
                "계정이 잠금 처리되었습니다. 관리자에게 문의해 주세요.",
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabledException(
            DisabledException ex, WebRequest request) {
        log.debug("Account disabled");
        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "ACCOUNT_DISABLED",
                "계정이 비활성화되었습니다. 관리자에게 문의하시거나 활성화 요청 페이지에서 요청해 주세요.",
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.debug("Validation error");
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "입력값이 올바르지 않습니다.",
                getPath(request)
        );
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            error.addFieldError(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex, WebRequest request) {
        log.debug("File size exceeded");
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "FILE_SIZE_EXCEEDED",
                "파일 크기가 허용된 최대 크기를 초과했습니다.",
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        // 스택트레이스는 로그로만 기록, 외부 노출 금지
        log.error("Unhandled exception", ex);
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "서버 내부 오류가 발생했습니다.",
                getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String getPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
