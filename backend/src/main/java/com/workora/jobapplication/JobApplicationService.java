package com.workora.jobapplication;

import com.workora.common.PageResponse;
import com.workora.jobapplication.dto.ApplicationStatsResponse;
import com.workora.jobapplication.dto.JobApplicationRequest;
import com.workora.jobapplication.dto.JobApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private static final Sort DEFAULT_SORT =
            Sort.by(Sort.Order.desc("appliedDate"), Sort.Order.desc("createdAt"));

    private final JobApplicationRepository repository;

    @Transactional
    public JobApplicationResponse create(UUID userId, JobApplicationRequest request) {
        JobApplication application = new JobApplication(userId);
        applyChanges(application, request);
        // saveAndFlush forces the INSERT now, so id and timestamps are filled before we build the response
        return JobApplicationResponse.from(repository.saveAndFlush(application));
    }

    @Transactional(readOnly = true)
    public PageResponse<JobApplicationResponse> list(UUID userId, ApplicationStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, DEFAULT_SORT);
        Page<JobApplication> result = (status == null)
                ? repository.findByUserId(userId, pageable)
                : repository.findByUserIdAndStatus(userId, status, pageable);
        return PageResponse.from(result.map(JobApplicationResponse::from));
    }

    @Transactional(readOnly = true)
    public JobApplicationResponse get(UUID userId, UUID id) {
        return JobApplicationResponse.from(findOwned(userId, id));
    }

    @Transactional
    public JobApplicationResponse update(UUID userId, UUID id, JobApplicationRequest request) {
        JobApplication application = findOwned(userId, id);
        applyChanges(application, request);
        return JobApplicationResponse.from(repository.saveAndFlush(application));
    }

    @Transactional
    public JobApplicationResponse updateStatus(UUID userId, UUID id, ApplicationStatus status) {
        JobApplication application = findOwned(userId, id);
        application.setStatus(status);
        return JobApplicationResponse.from(repository.saveAndFlush(application));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        if (repository.deleteByIdAndUserId(id, userId) == 0) {
            throw new JobApplicationNotFoundException();
        }
    }

    @Transactional(readOnly = true)
    public ApplicationStatsResponse stats(UUID userId) {
        Map<ApplicationStatus, Long> byStatus = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus s : ApplicationStatus.values()) {
            byStatus.put(s, 0L);                       // statuses with no rows still appear, as 0
        }
        repository.countByStatus(userId).forEach(c -> byStatus.put(c.getStatus(), c.getTotal()));
        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        return new ApplicationStatsResponse(total, byStatus);
    }

    /** The ONLY way a record is fetched by id: the owner is part of the lookup. Not yours = not found. */
    private JobApplication findOwned(UUID userId, UUID id) {
        return repository.findByIdAndUserId(id, userId).orElseThrow(JobApplicationNotFoundException::new);
    }

    private static void applyChanges(JobApplication a, JobApplicationRequest r) {
        a.setCompanyName(r.companyName().trim());
        a.setJobTitle(r.jobTitle().trim());
        a.setLocation(blankToNull(r.location()));
        a.setJobUrl(blankToNull(r.jobUrl()));
        a.setStatus(r.status());
        a.setAppliedDate(r.appliedDate());
        a.setNotes(blankToNull(r.notes()));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}