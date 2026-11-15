package com.workora.jobapplication;

import com.workora.jobapplication.dto.ApplicationStatsResponse;
import com.workora.jobapplication.dto.JobApplicationRequest;
import com.workora.jobapplication.dto.JobApplicationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobApplicationServiceTest {

    @Mock JobApplicationRepository repository;
    @InjectMocks JobApplicationService service;   // Mockito builds it, injecting the mock repository

    private final UUID userId = UUID.randomUUID();
    private final UUID applicationId = UUID.randomUUID();

    @Test
    @DisplayName("create stamps the owner from the caller, trims text and turns blanks into null")
    void create_setsOwnerAndCleansInput() {
        when(repository.saveAndFlush(any(JobApplication.class))).thenAnswer(i -> i.getArgument(0));
        JobApplicationRequest request = new JobApplicationRequest(
                "  Acme  ", " Java Developer ", "   ", "https://acme.com/job",
                ApplicationStatus.APPLIED, LocalDate.of(2026, 11, 10), "");

        JobApplicationResponse response = service.create(userId, request);

        ArgumentCaptor<JobApplication> captor = ArgumentCaptor.forClass(JobApplication.class);
        verify(repository).saveAndFlush(captor.capture());
        JobApplication saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getCompanyName()).isEqualTo("Acme");
        assertThat(saved.getJobTitle()).isEqualTo("Java Developer");
        assertThat(saved.getLocation()).isNull();
        assertThat(saved.getNotes()).isNull();
        assertThat(response.companyName()).isEqualTo("Acme");
    }

    @Test
    @DisplayName("get throws NotFound when the record is missing or belongs to someone else")
    void get_notOwned_throwsNotFound() {
        when(repository.findByIdAndUserId(applicationId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(userId, applicationId))
                .isInstanceOf(JobApplicationNotFoundException.class);
    }

    @Test
    @DisplayName("updateStatus changes only the status of an owned application")
    void updateStatus_changesStatus() {
        JobApplication existing = new JobApplication(userId);
        existing.setCompanyName("Acme");
        existing.setStatus(ApplicationStatus.APPLIED);
        when(repository.findByIdAndUserId(applicationId, userId)).thenReturn(Optional.of(existing));
        when(repository.saveAndFlush(existing)).thenReturn(existing);

        JobApplicationResponse response = service.updateStatus(userId, applicationId, ApplicationStatus.OFFER);

        assertThat(response.status()).isEqualTo(ApplicationStatus.OFFER);
        assertThat(existing.getCompanyName()).isEqualTo("Acme");
    }

    @Test
    @DisplayName("delete throws NotFound when nothing was deleted")
    void delete_nothingDeleted_throwsNotFound() {
        when(repository.deleteByIdAndUserId(applicationId, userId)).thenReturn(0L);

        assertThatThrownBy(() -> service.delete(userId, applicationId))
                .isInstanceOf(JobApplicationNotFoundException.class);
    }

    @Test
    @DisplayName("stats reports every status, using 0 for the ones with no rows")
    void stats_fillsMissingStatusesWithZero() {
        when(repository.countByStatus(userId)).thenReturn(List.of(
                new Count(ApplicationStatus.APPLIED, 3), new Count(ApplicationStatus.OFFER, 1)));

        ApplicationStatsResponse stats = service.stats(userId);

        assertThat(stats.total()).isEqualTo(4);
        assertThat(stats.byStatus()).hasSize(ApplicationStatus.values().length);
        assertThat(stats.byStatus().get(ApplicationStatus.APPLIED)).isEqualTo(3);
        assertThat(stats.byStatus().get(ApplicationStatus.REJECTED)).isZero();
    }

    /** A tiny hand-written stand-in for the repository projection interface. */
    private record Count(ApplicationStatus status, long total) implements JobApplicationRepository.StatusCount {
        @Override public ApplicationStatus getStatus() { return status; }
        @Override public long getTotal() { return total; }
    }
}