package com.promise_jar.controller;

import com.promise_jar.model.CharacterProfile;
import com.promise_jar.model.PartnerType;
import com.promise_jar.model.PromisePartner;
import com.promise_jar.repository.CharacterProfileRepository;
import com.promise_jar.repository.PromisePartnerRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/partners/{partnerId}/profile")
@Tag(name = "角色档案管理", description = "管理虚拟角色的个性化档案")
public class CharacterProfileController {

  private final CharacterProfileRepository profileRepository;
  private final PromisePartnerRepository partnerRepository;

  public CharacterProfileController(
      CharacterProfileRepository profileRepository,
      PromisePartnerRepository partnerRepository) {
    this.profileRepository = profileRepository;
    this.partnerRepository = partnerRepository;
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
   * 统一返回错误信息
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
   * 检查约定对象是否属于当前登录用户
   */
  private PromisePartner getOwnedCharacter(
      Long partnerId,
      Long userId) {
    PromisePartner partner = partnerRepository
        .findByIdAndOwnerId(partnerId, userId)
        .orElse(null);

    if (partner == null) {
      return null;
    }

    // 只有 CHARACTER 类型的对象可以配置角色档案
    if (partner.getType() != PartnerType.CHARACTER) {
      return null;
    }

    return partner;
  }

  /**
   * 将角色档案转换为响应数据
   */
  private Map<String, Object> toResponse(
      CharacterProfile profile) {
    Map<String, Object> result = new HashMap<>();

    result.put("id", profile.getId());
    result.put("partnerId", profile.getPartner().getId());
    result.put("avatar", profile.getAvatar());
    result.put("personality", profile.getPersonality());
    result.put("relationshipType", profile.getRelationshipType());
    result.put("nicknameForUser", profile.getNicknameForUser());
    result.put("speakingStyle", profile.getSpeakingStyle());

    return result;
  }

  /**
   * 创建角色档案
   *
   * POST /api/partners/{partnerId}/profile
   */
  @PostMapping
  @Operation(summary = "创建角色档案")
  public ResponseEntity<?> createProfile(
      @PathVariable Long partnerId,
      @RequestBody Map<String, String> request,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = getOwnedCharacter(partnerId, userId);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在、无权访问，或该对象不是虚拟角色");
    }

    if (profileRepository.findByPartnerId(partnerId).isPresent()) {
      return error(
          HttpStatus.CONFLICT,
          "该角色已经有档案，请使用修改接口");
    }

    CharacterProfile profile = new CharacterProfile();

    profile.setPartner(partner);
    profile.setAvatar(request.get("avatar"));
    profile.setPersonality(request.get("personality"));
    profile.setRelationshipType(request.get("relationshipType"));
    profile.setNicknameForUser(request.get("nicknameForUser"));
    profile.setSpeakingStyle(request.get("speakingStyle"));

    CharacterProfile saved = profileRepository.save(profile);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(toResponse(saved));
  }

  /**
   * 查看角色档案
   *
   * GET /api/partners/{partnerId}/profile
   */
  @GetMapping
  @Operation(summary = "查看角色档案")
  public ResponseEntity<?> getProfile(
      @PathVariable Long partnerId,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = getOwnedCharacter(partnerId, userId);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在、无权访问，或该对象不是虚拟角色");
    }

    CharacterProfile profile = profileRepository
        .findByPartnerId(partnerId)
        .orElse(null);

    if (profile == null) {
      return error(HttpStatus.NOT_FOUND, "该角色还没有档案");
    }

    return ResponseEntity.ok(toResponse(profile));
  }

  /**
   * 修改角色档案
   *
   * PUT /api/partners/{partnerId}/profile
   */
  @PutMapping
  @Operation(summary = "修改角色档案")
  public ResponseEntity<?> updateProfile(
      @PathVariable Long partnerId,
      @RequestBody Map<String, String> request,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = getOwnedCharacter(partnerId, userId);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在、无权访问，或该对象不是虚拟角色");
    }

    CharacterProfile profile = profileRepository
        .findByPartnerId(partnerId)
        .orElse(null);

    if (profile == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "该角色还没有档案，请先创建");
    }

    // 只修改请求中明确提供的字段
    if (request.containsKey("avatar")) {
      profile.setAvatar(request.get("avatar"));
    }

    if (request.containsKey("personality")) {
      profile.setPersonality(request.get("personality"));
    }

    if (request.containsKey("relationshipType")) {
      profile.setRelationshipType(
          request.get("relationshipType"));
    }

    if (request.containsKey("nicknameForUser")) {
      profile.setNicknameForUser(
          request.get("nicknameForUser"));
    }

    if (request.containsKey("speakingStyle")) {
      profile.setSpeakingStyle(
          request.get("speakingStyle"));
    }

    CharacterProfile saved = profileRepository.save(profile);

    return ResponseEntity.ok(toResponse(saved));
  }

  /**
   * 删除角色档案
   *
   * DELETE /api/partners/{partnerId}/profile
   */
  @DeleteMapping
  @Operation(summary = "删除角色档案")
  public ResponseEntity<?> deleteProfile(
      @PathVariable Long partnerId,
      HttpSession session) {
    Long userId = getCurrentUserId(session);

    if (userId == null) {
      return error(HttpStatus.UNAUTHORIZED, "请先登录");
    }

    PromisePartner partner = getOwnedCharacter(partnerId, userId);

    if (partner == null) {
      return error(
          HttpStatus.NOT_FOUND,
          "约定对象不存在、无权访问，或该对象不是虚拟角色");
    }

    CharacterProfile profile = profileRepository
        .findByPartnerId(partnerId)
        .orElse(null);

    if (profile == null) {
      return error(HttpStatus.NOT_FOUND, "角色档案不存在");
    }

    profileRepository.delete(profile);

    Map<String, Object> result = new HashMap<>();
    result.put("success", true);
    result.put("message", "角色档案已删除");

    return ResponseEntity.ok(result);
  }
}
