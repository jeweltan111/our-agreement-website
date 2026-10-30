package com.promise_jar.repository;

import com.promise_jar.model.PromisePartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromisePartnerRepository
        extends JpaRepository<PromisePartner, Long> {

    // 查询当前用户创建的所有约定对象
    List<PromisePartner> findByOwnerId(Long ownerId);

    // 根据对象 ID 和所属用户 ID 查询对象，防止越权访问
    Optional<PromisePartner> findByIdAndOwnerId(
            Long id,
            Long ownerId);
}