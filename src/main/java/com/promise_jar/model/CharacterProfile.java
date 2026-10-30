package com.promise_jar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "character_profiles")
@Getter
@Setter
public class CharacterProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private PromisePartner partner;

    private String avatar;

    @Column(columnDefinition = "TEXT")
    private String personality;

    private String relationshipType;

    private String nicknameForUser;

    @Column(columnDefinition = "TEXT")
    private String speakingStyle;

    public CharacterProfile() {
    }
}
