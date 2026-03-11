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

        // 애플리케이션 context-path(/api) 하위에서 /uploads/** 를 실제 업로드 폴더로 서빙한다.
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
