package com.workora.jobapplication.dto;

import com.workora.jobapplication.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull ApplicationStatus status) {}