package com.workora.jobapplication;

public class JobApplicationNotFoundException extends RuntimeException {
    public JobApplicationNotFoundException() {
        super("Job application not found");
    }
}