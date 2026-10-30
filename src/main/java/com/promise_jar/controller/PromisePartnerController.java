package com.promise_jar.controller;

import com.promise_jar.model.PartnerType;
import com.promise_jar.model.PromisePartner;
import com.promise_jar.model.User;
import com.promise_jar.repository.PromisePartnerRepository;
import com.promise_jar.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partners")
@Tag(name = "约定对象管理", description = "管理用户创建的约定对象")
public class PromisePartnerController {

  private final PromisePartnerRepository partnerRepository;
  private final UserRepository userRepository;

  public PromisePartnerController(
      PromisePartnerRepository partnerRepository,
      UserRepository userRepository) {
    this.partnerRepository = partnerRepository;
    this.userRepository = userRepository;
  }

  /**
   * 获取当前登录用户 ID
   */
  private Long getCurrentUserId(HttpSession session) {
    Object userId = session.getAttribute("USER_ID");

    if (userId instanceof Number) {
      return ((Number) userId).longValue();
    }

    return null;
  }

  /**
   * 统一构建错误响应
   */
  private ResponseEntity<Map<String, Object>> error(
      HttpStatus status,
      String message) {
    Map<String, Object> result = new HashMap<>();
    result.put("success", false);
    result.put("message", message);

    return ResponseEntity.status(status).body(result);
  }

  /**
   * 转换为安全的响应数据。
   * 不直接返回完整的 User 实体，避免暴露密码等信息。
   */
  private Map<String, Object> toResponse(PromisePartner partner) {
    Map<String, Object> result = new HashMap<>();

    result.put("id", partner.getId());
    result.put("name", partner.getName());
    result.put("type", partner.getType());

    if (partner.getLinkedUser() != null) {
      result.put("linkedUserId", partner.getLinkedUser().getId());
      result.put("linkedUserNickname",
          partner.getLinkedUser().getNickname());
    } else {
      result.put("linkedUserId", null);
      result.put("linkedUserNickname", null);
    }

    return result;
  }

  /**
   * 创建约定对象
   *
   * POST /api/partners
   */
  @PostMapping
  @Operation(summary = "创建约定对象")
  public ResponseEntity<?> createPartner(
      @RequestBody Map<String, String> request,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    User owner = userRepository.findById(userId).orElse(null);

    if (owner == null) {
      return error(HttpStatus.UNAUTHORIZED, "用户不存在，请重新登录");
    }

    String name = request.get("name");
    String typeText = request.get("type");

    if (name == null || name.trim().isEmpty()) {
      return error(HttpStatus.BAD_REQUEST, "约定对象名称不能为空");
    }

    if (name.trim().length() > 100) {
      return error(HttpStatus.BAD_REQUEST, "名称不能超过100个字符");
    }

    if (typeText == null || typeText.trim().isEmpty()) {
      return error(HttpStatus.BAD_REQUEST, "请指定约定对象类型");
    }

    PartnerType type;

    try {
      type = PartnerType.valueOf(typeText.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      return error(
          HttpStatus.BAD_REQUEST,
          "对象类型不正确，可选值为 USER、CHARACTER、CUSTOM");
    }

    /*
     * 当前版本先完成约定对象的基本管理。
     * USER 类型的真实用户绑定需要单独设计验证流程，
     * 不能让客户端随意传入一个用户 ID 就完成绑定。
     */
    if (type == PartnerType.USER) {
      return error(
          HttpStatus.BAD_REQUEST,
          "真实用户绑定功能暂未开放，请先创建虚拟角色或自定义对象");
    }

    PromisePartner partner = new PromisePartner();

    partner.setOwner(owner);
    partner.setName(name.trim());
    partner.setType(type);
    partner.setLinkedUser(null);

    PromisePartner saved = partnerRepository.save(partner);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(toResponse(saved));
  }

  /**
   * 查看当前用户创建的所有约定对象
   *
   * GET /api/partners
   */
  @GetMapping
  @Operation(summary = "查看我的约定对象列表")
  public ResponseEntity<?> getMyPartners(HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    List<Map<String, Object>> result = partnerRepository.findByOwnerId(userId)
        .stream()
        .map(this::toResponse)
        .toList();

    return ResponseEntity.ok(result);
  }

  /**
   * 查看单个约定对象
   *
   * GET /api/partners/{id}
   */
  @GetMapping("/{id}")
  @Operation(summary = "查看单个约定对象")
  public ResponseEntity<?> getPartner(
      @PathVariable Long id,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = partnerRepository
        .findByIdAndOwnerId(id, userId)
        .orElse(null);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在，或你没有查看权限");
    }

    return ResponseEntity.ok(toResponse(partner));
  }

  /**
   * 修改约定对象名称
   *
   * PUT /api/partners/{id}
   */
  @PutMapping("/{id}")
  @Operation(summary = "修改约定对象")
  public ResponseEntity<?> updatePartner(
      @PathVariable Long id,
      @RequestBody Map<String, String> request,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = partnerRepository
        .findByIdAndOwnerId(id, userId)
        .orElse(null);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在，或你没有修改权限");
    }

    String name = request.get("name");

    if (name == null || name.trim().isEmpty()) {
      return error(HttpStatus.BAD_REQUEST, "名称不能为空");
    }

    if (name.trim().length() > 100) {
      return error(HttpStatus.BAD_REQUEST, "名称不能超过100个字符");
    }

    partner.setName(name.trim());

    PromisePartner saved = partnerRepository.save(partner);

    return ResponseEntity.ok(toResponse(saved));
  }

  /**
   * 删除约定对象
   *
   * DELETE /api/partners/{id}
   */
  @DeleteMapping("/{id}")
  @Operation(summary = "删除约定对象")
  public ResponseEntity<?> deletePartner(
      @PathVariable Long id,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = partnerRepository
        .findByIdAndOwnerId(id, userId)
        .orElse(null);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在，或你没有删除权限");
    }

    partnerRepository.delete(partner);

    Map<String, Object> result = new HashMap<>();
    result.put("success", true);
    result.put("message", "约定对象已删除");

    return ResponseEntity.ok(result);
  }
}