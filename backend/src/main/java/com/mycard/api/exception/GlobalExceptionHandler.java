package com.mycard.api.exception;

import com.mycard.api.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
                        ResourceNotFoundException ex, WebRequest request) {
                log.debug("Resource not found: {}", ex.getMessage());
                ErrorResponse error = new ErrorResponse(
                                "NOT_FOUND",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDeniedException(
                        AccessDeniedException ex, WebRequest request) {
                log.debug("Access denied: {}", ex.getMessage());
                ErrorResponse error = new ErrorResponse(
                                "ACCESS_DENIED",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleSpringAccessDeniedException(
                        org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
                log.debug("Spring access denied: {}", ex.getMessage());
                ErrorResponse error = new ErrorResponse(
                                "ACCESS_DENIED",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ErrorResponse> handleBadRequestException(
                        BadRequestException ex, WebRequest request) {
                log.debug("Bad request: {}", ex.getMessage());
                ErrorResponse error = new ErrorResponse(
                                "BAD_REQUEST",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        @ExceptionHandler(DuplicateResourceException.class)
        public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
                        DuplicateResourceException ex, WebRequest request) {
                log.debug("Duplicate resource: {}", ex.getMessage());
                ErrorResponse error = new ErrorResponse(
                                "DUPLICATE_RESOURCE",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.CONFLICT);
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ErrorResponse> handleBadCredentialsException(
                        BadCredentialsException ex, WebRequest request) {
                log.debug("Bad credentials attempt");
                ErrorResponse error = new ErrorResponse(
                                "INVALID_CREDENTIALS",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }

        @ExceptionHandler(UnauthorizedException.class)
        public ResponseEntity<ErrorResponse> handleUnauthorizedException(
                        UnauthorizedException ex, WebRequest request) {
                log.debug("Unauthorized request: {}", ex.getCode());
                ErrorResponse error = new ErrorResponse(
                                ex.getCode(),
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ErrorResponse> handleLockedException(
            LockedException ex, WebRequest request) {
        log.debug("Account locked");
        ErrorResponse error = new ErrorResponse(
                "ACCOUNT_LOCKED",
                "요청하신 페이지를 처리할 수 없습니다."
        );
        return new ResponseEntity<>(error, HttpStatus.valueOf(423));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabledException(
            DisabledException ex, WebRequest request) {
        log.debug("Account disabled");
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "계정이 비활성화되었습니다. 관리자에게 문의하시거나 활성화 요청 페이지에서 요청해 주세요.";
        String code = message.contains("회원 탈퇴가 예약")
                ? "WITHDRAWAL_PENDING"
                : "ACCOUNT_DISABLED";
        ErrorResponse error = new ErrorResponse(
                code,
                "요청하신 페이지를 처리할 수 없습니다."
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationException(
                        MethodArgumentNotValidException ex, WebRequest request) {
                log.debug("Validation error");
                ErrorResponse error = new ErrorResponse(
                                "VALIDATION_ERROR",
                                "요청하신 페이지를 처리할 수 없습니다.");
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
                                "FILE_SIZE_EXCEEDED",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        @ExceptionHandler(NoHandlerFoundException.class)
        public ResponseEntity<ErrorResponse> handleNoHandlerFoundException(
                        NoHandlerFoundException ex, WebRequest request) {
                log.debug("No handler found: {}", ex.getRequestURL());
                ErrorResponse error = new ErrorResponse(
                                "NOT_FOUND",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }

        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(
                        HttpRequestMethodNotSupportedException ex, WebRequest request) {
                log.debug("Method not supported: {}", ex.getMethod());
                ErrorResponse error = new ErrorResponse(
                                "METHOD_NOT_ALLOWED",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGlobalException(
                        Exception ex, WebRequest request) {
                // 스택트레이스는 로그로만 기록, 외부 노출 금지
                log.error("Unhandled exception", ex);
                ErrorResponse error = new ErrorResponse(
                                "INTERNAL_ERROR",
                                "요청하신 페이지를 처리할 수 없습니다.");
                return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
}
