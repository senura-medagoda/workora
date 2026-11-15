package com.workora.jobapplication;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "job_applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Setter(AccessLevel.NONE)
    private UUID id;

    // The owner. Set once in the constructor and never changeable afterwards.
    @Column(name = "user_id", nullable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private UUID userId;

    @Column(name = "company_name", nullable = false, length = 150)
    @Setter
    private String companyName;

    @Column(name = "job_title", nullable = false, length = 150)
    @Setter
    private String jobTitle;

    @Column(length = 150)
    @Setter
    private String location;

    @Column(name = "job_url", length = 500)
    @Setter
    private String jobUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Setter
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "applied_date", nullable = false)
    @Setter
    private LocalDate appliedDate;

    @Column(columnDefinition = "text")
    @Setter
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Setter(AccessLevel.NONE)
    private Instant updatedAt;

    public JobApplication(UUID userId) {
        this.userId = userId;
    }
}