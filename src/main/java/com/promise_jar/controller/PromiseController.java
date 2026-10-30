package com.promise_jar.controller;

import com.promise_jar.model.Promise;
import com.promise_jar.model.PromiseStatus;
import com.promise_jar.model.User;
import com.promise_jar.repository.PromiseRepository;
import com.promise_jar.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "约定管理", description = "约定的创建、查询、修改和删除")
@RestController
@RequestMapping("/api/promises")
public class PromiseController {

  private final PromiseRepository promiseRepository;
  private final UserRepository userRepository;

  public PromiseController(
      PromiseRepository promiseRepository,
      UserRepository userRepository) {

    this.promiseRepository = promiseRepository;
    this.userRepository = userRepository;
  }

  @Operation(summary = "获取我的所有约定", description = "根据当前登录用户获取属于自己的全部约定")
  @GetMapping
  public ResponseEntity<List<Promise>> getAllPromises(
      HttpSession session) {

    Long userId = (Long) session.getAttribute("USER_ID");

    if (userId == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .build();
    }

    List<Promise> promises = promiseRepository
        .findByCreatorId(userId);

    return ResponseEntity.ok(promises);
  }

  @Operation(summary = "查看一个约定", description = "根据约定ID查看当前用户拥有的约定")
  @GetMapping("/{id}")
  public ResponseEntity<Promise> getPromiseById(
      @PathVariable Long id,
      HttpSession session) {

    Long userId = (Long) session.getAttribute("USER_ID");

    if (userId == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .build();
    }

    return promiseRepository.findById(id)
        .filter(promise -> promise.getCreator() != null
            && promise.getCreator().getId().equals(userId))
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @Operation(summary = "创建约定", description = "创建一个新的约定，并自动绑定当前登录用户")
  @PostMapping
  public ResponseEntity<Promise> createPromise(
      @RequestBody Promise promise,
      HttpSession session) {

    Long userId = (Long) session.getAttribute("USER_ID");

    if (userId == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .build();
    }

    User user = userRepository.findById(userId)
        .orElse(null);

    if (user == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .build();
    }

    promise.setCreator(user);
    promise.setCreatedAt(LocalDateTime.now());

    if (promise.getStatus() == null) {
      promise.setStatus(PromiseStatus.ACTIVE);
    }

    Promise savedPromise = promiseRepository.save(promise);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedPromise);
  }

  @Operation(summary = "修改约定", description = "修改当前登录用户拥有的约定")
  @PutMapping("/{id}")
  public ResponseEntity<Promise> updatePromise(
      @PathVariable Long id,
      @RequestBody Promise newPromise,
      HttpSession session) {

    Long userId = (Long) session.getAttribute("USER_ID");

    if (userId == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .build();
    }

    return promiseRepository.findById(id)
        .filter(promise -> promise.getCreator() != null
            && promise.getCreator().getId().equals(userId))
        .map(existingPromise -> {
          existingPromise.setTitle(newPromise.getTitle());
          existingPromise.setDescription(newPromise.getDescription());
          existingPromise.setLocation(newPromise.getLocation());
          existingPromise.setPromiseDate(newPromise.getPromiseDate());

          if (newPromise.getStatus() != null) {
            existingPromise.setStatus(newPromise.getStatus());
          }
          if (newPromise.getCompletedAt() != null) {
            existingPromise.setCompletedAt(newPromise.getCompletedAt());
          }

          Promise updatedPromise = promiseRepository.save(existingPromise);
          return ResponseEntity.ok(updatedPromise);
        })
        .orElse(ResponseEntity.notFound().build());
  }

  @Operation(summary = "删除约定", description = "删除当前登录用户拥有的约定")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deletePromise(
      @PathVariable Long id,
      HttpSession session) {

    Long userId = (Long) session.getAttribute("USER_ID");

    if (userId == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .build();
    }

    return promiseRepository.findById(id)
        .filter(promise -> promise.getCreator() != null
            && promise.getCreator().getId().equals(userId))
        .map(promise -> {
          promiseRepository.delete(promise);
          return ResponseEntity.noContent().<Void>build();
        })
        .orElse(ResponseEntity.notFound().build());
  }
}
