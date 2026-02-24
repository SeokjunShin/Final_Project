package com.mycard.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private int status;
    private String code;
    private String message;
    private String path;
    private LocalDateTime timestamp;
    private List<FieldError> errors;

    public ErrorResponse(int status, String code, String message, String path) {
        this.status = status;
        this.code = code;
        this.message = message;
        this.path = path;
        this.timestamp = LocalDateTime.now();
    }

    public void addFieldError(String field, String message) {
        if (errors == null) {
            errors = new ArrayList<>();
        }
        errors.add(new FieldError(field, message));
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class FieldError {
        private String field;
        private String message;

        public FieldError(String field, String message) {
            this.field = field;
            this.message = message;
        }
    }
}
