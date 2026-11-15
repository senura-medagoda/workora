CREATE TABLE job_applications (
                                  id           UUID         PRIMARY KEY,
                                  user_id      UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                                  company_name VARCHAR(150) NOT NULL,
                                  job_title    VARCHAR(150) NOT NULL,
                                  location     VARCHAR(150),
                                  job_url      VARCHAR(500),
                                  status       VARCHAR(20)  NOT NULL DEFAULT 'APPLIED',
                                  applied_date DATE         NOT NULL,
                                  notes        TEXT,
                                  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
                                  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
                                  CONSTRAINT ck_job_applications_status
                                      CHECK (status IN ('APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'))
);

CREATE INDEX idx_job_applications_user_applied ON job_applications (user_id, applied_date DESC);
CREATE INDEX idx_job_applications_user_status  ON job_applications (user_id, status);