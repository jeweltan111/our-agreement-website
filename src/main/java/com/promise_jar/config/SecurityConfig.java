package com.promise_jar.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                // 目前项目使用 HttpSession 自己管理登录状态
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/").permitAll()

                        .requestMatchers(
                                "/index.html",
                                "/style.css",
                                "/app.js",
                                "/music/**",
                                "/images/**")
                        .permitAll()

                        // 注册、登录、当前用户、退出登录
                        .requestMatchers(
                                "/api/auth/**")
                        .permitAll()

                        // Swagger
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**")
                        .permitAll()

                        // Promise 的权限由 PromiseController + HttpSession 判断
                        .requestMatchers(
                                "/api/promises/**")
                        .permitAll()

                        .anyRequest().permitAll());

        return http.build();
    }
}