package com.promise_jar.repository;

import com.promise_jar.model.CharacterProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CharacterProfileRepository extends JpaRepository<CharacterProfile, Long> {
    Optional<CharacterProfile> findByPartnerId(Long partnerId);
}
