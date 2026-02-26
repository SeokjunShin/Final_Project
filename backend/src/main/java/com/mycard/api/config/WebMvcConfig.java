package com.mycard.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.base-path:/var/lib/mycard/uploads}")
    private String uploadBasePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = Paths.get(uploadBasePath).toAbsolutePath().normalize().toString();
        // 윈도우 경로 처리 (file:///)
        String resourceLocation = "file:///" + uploadDir.replace("\\", "/") + "/";

        // /api/uploads/** 경로로 요청이 오면 실제 로컬 파일 시스템의 폴더에서 서빙
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
