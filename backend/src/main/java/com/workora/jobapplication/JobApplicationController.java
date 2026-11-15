package com.workora.jobapplication;

import com.workora.common.PageResponse;
import com.workora.jobapplication.dto.ApplicationStatsResponse;
import com.workora.jobapplication.dto.JobApplicationRequest;
import com.workora.jobapplication.dto.JobApplicationResponse;
import com.workora.jobapplication.dto.UpdateStatusRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Job applications")
@SecurityRequirement(name = "bearerAuth")
public class JobApplicationController {

    private final JobApplicationService service;

    @PostMapping
    public ResponseEntity<JobApplicationResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                         @Valid @RequestBody JobApplicationRequest request) {
        JobApplicationResponse created = service.create(userId(jwt), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    public PageResponse<JobApplicationResponse> list(@AuthenticationPrincipal Jwt jwt,
                                                     @RequestParam(required = false) ApplicationStatus status,
                                                     @RequestParam(defaultValue = "0") @Min(0) int page,
                                                     @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size) {
        return service.list(userId(jwt), status, page, size);
    }

    @GetMapping("/stats")
    public ApplicationStatsResponse stats(@AuthenticationPrincipal Jwt jwt) {
        return service.stats(userId(jwt));
    }

    @GetMapping("/{id}")
    public JobApplicationResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.get(userId(jwt), id);
    }

    @PutMapping("/{id}")
    public JobApplicationResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                         @Valid @RequestBody JobApplicationRequest request) {
        return service.update(userId(jwt), id, request);
    }

    @PatchMapping("/{id}/status")
    public JobApplicationResponse updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                               @Valid @RequestBody UpdateStatusRequest request) {
        return service.updateStatus(userId(jwt), id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(userId(jwt), id);
    }

    /** The one place identity is read: from the signature-verified token, never from the request. */
    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}