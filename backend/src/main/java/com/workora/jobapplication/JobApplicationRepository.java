package com.workora.jobapplication;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    Page<JobApplication> findByUserId(UUID userId, Pageable pageable);

    Page<JobApplication> findByUserIdAndStatus(UUID userId, ApplicationStatus status, Pageable pageable);

    // Every single-record lookup includes the owner. There is deliberately NO plain findById usage for this entity.
    Optional<JobApplication> findByIdAndUserId(UUID id, UUID userId);

    /** Returns how many rows were deleted (0 = not found, or not yours). */
    long deleteByIdAndUserId(UUID id, UUID userId);

    @Query("""
            select a.status as status, count(a) as total
            from JobApplication a
            where a.userId = :userId
            group by a.status
            """)
    List<StatusCount> countByStatus(@Param("userId") UUID userId);

    /** A projection: Spring fills this interface straight from the query's aliased columns. */
    interface StatusCount {
        ApplicationStatus getStatus();
        long getTotal();
    }
}