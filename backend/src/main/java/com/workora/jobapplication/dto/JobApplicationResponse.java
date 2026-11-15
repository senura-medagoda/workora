package com.workora.jobapplication.dto;

import com.workora.jobapplication.ApplicationStatus;
import com.workora.jobapplication.JobApplication;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JobApplicationResponse(
        UUID id,
        String companyName,
        String jobTitle,
        String location,
        String jobUrl,
        ApplicationStatus status,
        LocalDate appliedDate,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static JobApplicationResponse from(JobApplication a) {
        return new JobApplicationResponse(
                a.getId(), a.getCompanyName(), a.getJobTitle(), a.getLocation(), a.getJobUrl(),
                a.getStatus(), a.getAppliedDate(), a.getNotes(), a.getCreatedAt(), a.getUpdatedAt());
    }
}