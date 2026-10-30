package com.promise_jar.controller;

import com.promise_jar.model.User;
import com.promise_jar.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        public AuthController(
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {

                this.userRepository = userRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @PostMapping("/register")
        public ResponseEntity<?> register(
                        @RequestBody Map<String, String> request) {

                String username = request.get("username");
                String password = request.get("password");
                String nickname = request.get("nickname");

                if (username == null ||
                                password == null ||
                                nickname == null) {

                        return ResponseEntity
                                        .badRequest()
                                        .body("用户名、密码、昵称不能为空");
                }

                if (userRepository.existsByUsername(username)) {

                        return ResponseEntity
                                        .status(HttpStatus.CONFLICT)
                                        .body("用户名已经存在");
                }

                User user = new User();

                user.setUsername(username);

                user.setPassword(
                                passwordEncoder.encode(password));

                user.setNickname(nickname);

                user.setCreatedAt(
                                LocalDateTime.now());

                User savedUser = userRepository.save(user);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(Map.of(
                                                "id", savedUser.getId(),
                                                "username", savedUser.getUsername(),
                                                "nickname", savedUser.getNickname()));
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(
                        @RequestBody Map<String, String> request,
                        HttpSession session) {

                String username = request.get("username");

                String password = request.get("password");

                User user = userRepository
                                .findByUsername(username)
                                .orElse(null);

                if (user == null) {

                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body("用户名或密码错误");
                }

                if (!passwordEncoder.matches(
                                password,
                                user.getPassword())) {

                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body("用户名或密码错误");
                }

                session.setAttribute(
                                "USER_ID",
                                user.getId());

                return ResponseEntity.ok(
                                Map.of(
                                                "id", user.getId(),
                                                "username", user.getUsername(),
                                                "nickname", user.getNickname()));
        }

        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser(
                        HttpSession session) {

                Long userId = (Long) session.getAttribute("USER_ID");

                if (userId == null) {

                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body("尚未登录");
                }

                return userRepository
                                .findById(userId)
                                .map(user -> ResponseEntity.ok(
                                                Map.of(
                                                                "id", user.getId(),
                                                                "username",
                                                                user.getUsername(),

                                                                "nickname",
                                                                user.getNickname())))
                                .orElse(
                                                ResponseEntity
                                                                .status(
                                                                                HttpStatus.UNAUTHORIZED)
                                                                .body(
                                                                                Map.of(
                                                                                                "message",
                                                                                                "用户不存在")));
        }

        @PostMapping("/logout")
        public ResponseEntity<?> logout(
                        HttpSession session) {

                session.invalidate();

                return ResponseEntity.ok(
                                Map.of(
                                                "message",
                                                "已退出登录"));
        }
}
