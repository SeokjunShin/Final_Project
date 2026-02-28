package com.mycard.api.dto.user;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String address;
    private Boolean hasSecondaryPassword;
}
