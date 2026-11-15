package com.workora.jobapplication.dto;

import com.workora.jobapplication.ApplicationStatus;

import java.util.Map;

public record ApplicationStatsResponse(long total, Map<ApplicationStatus, Long> byStatus) {}