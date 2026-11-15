package com.workora.jobapplication.dto;

import com.workora.jobapplication.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record JobApplicationRequest(
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 150) String jobTitle,
        @Size(max = 150) String location,
        // only http(s) links; an empty string is allowed (the service stores it as null)
        @Size(max = 500) @Pattern(regexp = "^(https?://\\S+)?$", message = "must be a valid http(s) URL") String jobUrl,
        @NotNull ApplicationStatus status,
        @NotNull LocalDate appliedDate,
        @Size(max = 5000) String notes
) {}