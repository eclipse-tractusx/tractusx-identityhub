/*
 *   Copyright (c) 2025 Cofinity-X
 *   Copyright (c) 2025 LKS NEXT
 *   Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *
 *   This program and the accompanying materials are made available under the
 *   terms of the Apache License, Version 2.0 which is available at
 *   https://www.apache.org/licenses/LICENSE-2.0.
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *   WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *   License for the specific language governing permissions and limitations
 *   under the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 *
 */

-- only intended for and tested with Postgres!
CREATE TABLE IF NOT EXISTS edc_lease
(
    leased_by      VARCHAR NOT NULL,
    leased_at      BIGINT,
    lease_duration INTEGER NOT NULL,
    lease_id       VARCHAR NOT NULL
        CONSTRAINT lease_pk
            PRIMARY KEY
);

COMMENT ON COLUMN edc_lease.leased_at IS 'posix timestamp of lease';
COMMENT ON COLUMN edc_lease.lease_duration IS 'duration of lease in milliseconds';


CREATE TABLE IF NOT EXISTS edc_holder_credentialrequest
(
    id                     VARCHAR           NOT NULL PRIMARY KEY, -- this is also the holderPid
    state                  INTEGER           NOT NULL,
    state_count            INTEGER DEFAULT 0 NOT NULL,
    state_time_stamp       BIGINT,
    created_at             BIGINT            NOT NULL,
    updated_at             BIGINT            NOT NULL,
    trace_context          JSON,
    error_detail           VARCHAR,
    pending                BOOLEAN DEFAULT FALSE,
    lease_id               VARCHAR
        CONSTRAINT credreq_lease_lease_id_fk REFERENCES edc_lease ON DELETE SET NULL,
    participant_context_id VARCHAR           NOT NULL,
    issuer_did             VARCHAR           NOT NULL,
    ids_and_formats        JSON              NOT NULL,
    issuer_pid             VARCHAR
);


CREATE UNIQUE INDEX IF NOT EXISTS lease_lease_id_uindex ON edc_lease (lease_id);

-- This will help to identify states that need to be transitioned without a table scan when the entries grow
CREATE INDEX IF NOT EXISTS issuance_process_state ON edc_holder_credentialrequest (state, state_time_stamp);
